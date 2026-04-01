import { S3Browser } from './s3';

/** Presigned URL validity. Keep ≥ 2× REFRESH_BEFORE_EXPIRY_MS. */
const URL_EXPIRES_SECONDS = 3600; // 1 hour

/**
 * How long before URL expiry we fetch a replacement.
 * 5 minutes gives plenty of time even on slow connections.
 */
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Wraps an HTMLAudioElement and adds:
 *  - async play-by-S3-key (fetches presigned URL automatically)
 *  - background URL refresh so playback never hits an expired URL
 *
 * URL refresh strategy:
 *   1. On play(), presign a URL valid for URL_EXPIRES_SECONDS.
 *   2. Schedule a timer to fire REFRESH_BEFORE_EXPIRY_MS before it expires.
 *   3. On the timer: presign a new URL, save playback position, swap src,
 *      restore position, resume if was playing.
 *   4. The timer re-arms itself after each refresh so sessions of any
 *      length are supported.
 */
export class AudioPlayer {
    private readonly audio = new Audio();
    private currentKey: string | null = null;
    private refreshTimer: ReturnType<typeof setTimeout> | null = null;
    private urlExpiresAt = 0;

    // Callbacks wired by the UI layer
    onStateChange: (() => void) | null = null;
    onTimeUpdate: (() => void) | null = null;
    onEnded: (() => void) | null = null;

    constructor(private readonly s3: S3Browser) {
        this.audio.preload = 'metadata';
        this.audio.addEventListener('ended', () => this.onEnded?.());
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate?.());
        this.audio.addEventListener('play', () => this.onStateChange?.());
        this.audio.addEventListener('pause', () => this.onStateChange?.());
    }

    /** Loads and starts playing the S3 object at `key`. */
    async play(key: string): Promise<void> {
        await this.loadTrack(key, 0, true);
    }

    /**
     * Loads a track at a saved position and optionally starts playback.
     * Used to restore state after page reload or re-login.
     */
    async restore(key: string, atSeconds: number, autoplay: boolean): Promise<void> {
        await this.loadTrack(key, atSeconds, autoplay);
    }

    pause(): void {
        this.audio.pause();
    }

    resume(): void {
        void this.audio.play().then(() => {
            if (this.currentKey && this.refreshTimer === null) {
                this.scheduleRefresh();
            }
        });
    }

    stop(): void {
        this.cancelRefreshTimer();
        this.audio.pause();
        this.audio.src = '';
        this.currentKey = null;
        this.urlExpiresAt = 0;
        this.onStateChange?.();
    }

    seekTo(seconds: number): void {
        this.audio.currentTime = seconds;
    }

    seekToPct(pct: number): void {
        const d = this.audio.duration;
        if (isFinite(d) && d > 0) {
            this.audio.currentTime = d * pct;
        }
    }

    setVolume(level: number): void {
        const clamped = Math.min(1, Math.max(0, level));
        this.audio.volume = clamped;
    }

    get volume(): number {
        return this.audio.volume;
    }

    get isPlaying(): boolean {
        return !this.audio.paused;
    }

    get currentTrackKey(): string | null {
        return this.currentKey;
    }

    get currentTime(): number {
        return this.audio.currentTime;
    }

    get duration(): number {
        return this.audio.duration ?? 0;
    }

    // -------------------------------------------------------------------------
    // Presigned URL refresh
    // -------------------------------------------------------------------------

    private async loadTrack(key: string, atSeconds: number, autoplay: boolean): Promise<void> {
        this.cancelRefreshTimer();
        this.currentKey = key;

        const url = await this.s3.presignUrl(key, URL_EXPIRES_SECONDS);
        this.urlExpiresAt = Date.now() + URL_EXPIRES_SECONDS * 1000;

        this.audio.src = url;
        this.audio.load();

        await new Promise<void>((resolve) => {
            const onReady = () => {
                this.audio.removeEventListener('canplay', onReady);
                resolve();
            };
            this.audio.addEventListener('canplay', onReady);
        });

        if (Number.isFinite(atSeconds) && atSeconds > 0) {
            this.audio.currentTime = atSeconds;
        }

        if (autoplay) {
            await this.audio.play();
        }

        this.scheduleRefresh();
        this.onStateChange?.();
    }

    private scheduleRefresh(): void {
        const msUntilRefresh = this.urlExpiresAt - Date.now() - REFRESH_BEFORE_EXPIRY_MS;
        if (msUntilRefresh <= 0) {
            void this.refreshUrl();
            return;
        }
        this.refreshTimer = setTimeout(() => void this.refreshUrl(), msUntilRefresh);
    }

    private async refreshUrl(): Promise<void> {
        this.refreshTimer = null;
        if (!this.currentKey) return;

        console.log('[AudioPlayer] Refreshing presigned URL for', this.currentKey);

        const wasPlaying = this.isPlaying;
        const savedTime = this.audio.currentTime;

        try {
            const newUrl = await this.s3.presignUrl(this.currentKey, URL_EXPIRES_SECONDS);
            this.urlExpiresAt = Date.now() + URL_EXPIRES_SECONDS * 1000;

            // Swap URL while preserving playback position.
            // The browser will briefly buffer before resuming.
            this.audio.src = newUrl;
            this.audio.load();

            await new Promise<void>((resolve) => {
                const onReady = () => {
                    this.audio.removeEventListener('canplay', onReady);
                    resolve();
                };
                this.audio.addEventListener('canplay', onReady);
            });

            this.audio.currentTime = savedTime;
            if (wasPlaying) await this.audio.play();

            this.scheduleRefresh();
        } catch (err) {
            console.error('[AudioPlayer] URL refresh failed', err);
            // Retry in 30 s rather than leaving the player stalled
            this.refreshTimer = setTimeout(() => void this.refreshUrl(), 30_000);
        }
    }

    private cancelRefreshTimer(): void {
        if (this.refreshTimer !== null) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
}
