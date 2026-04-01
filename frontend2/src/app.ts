import { AuthService } from './auth';
import { S3Browser, S3Item } from './s3';
import { AudioPlayer } from './player';
import config from './config';

interface BrowserState {
    prefix: string;
    items: S3Item[];
    loading: boolean;
}

type View = 'loading' | 'login' | 'browser';

interface PersistedPlayerState {
    volume: number;
    trackKey: string | null;
    currentTime: number;
    wasPlaying: boolean;
}

const PLAYER_STATE_KEY = 's3-media-player:state';

/**
 * Top-level UI controller. Uses direct DOM manipulation — no framework.
 *
 * Layout (stable skeleton, never fully replaced):
 *   #app
 *     #main        ← login form  OR  breadcrumb + file list
 *     #player-bar  ← always present, hidden until logged in
 */
export class App {
    private root!: HTMLElement;
    private mainEl!: HTMLElement;
    private playerBarEl!: HTMLElement;

    // Player bar child refs that need live updates
    private trackNameEl!: HTMLElement;
    private playPauseBtn!: HTMLButtonElement;
    private seekBar!: HTMLInputElement;
    private volumeBar!: HTMLInputElement;
    private timeEl!: HTMLElement;
    private restoreNoticeEl!: HTMLElement;
    private restoreNoticeTimer: number | null = null;

    private view: View = 'loading';
    private browserState: BrowserState = { prefix: '', items: [], loading: false };
    private loginError = '';

    // True while the user holds the seek bar — prevents timeupdate from
    // clobbering their position
    private isSeeking = false;
    private lastStateSaveAt = 0;

    constructor(
        private readonly auth: AuthService,
        private readonly s3: S3Browser,
        private readonly player: AudioPlayer,
    ) {}

    mount(root: HTMLElement): void {
        this.root = root;

        this.mainEl = document.createElement('div');
        this.mainEl.id = 'main';
        this.root.appendChild(this.mainEl);

        this.playerBarEl = this.buildPlayerBar();
        this.root.appendChild(this.playerBarEl);

        this.applyPersistedVolume();

        // Wire player callbacks
        this.player.onStateChange = () => {
            this.updatePlayerBar();
            this.savePlayerState();
        };
        this.player.onTimeUpdate = () => {
            this.updateSeekBar();
            this.savePlayerStateThrottled();
        };
        this.player.onEnded = () => this.playNext();

        void this.init();
    }

    // -------------------------------------------------------------------------
    // Boot
    // -------------------------------------------------------------------------

    private async init(): Promise<void> {
        if (this.auth.isLoggedIn()) {
            try {
                await this.auth.restoreSession();
                await this.navigate('');
                await this.restorePlayerState();
                return;
            } catch {
                // session expired / invalid → fall through to login
            }
        }
        this.view = 'login';
        this.render();
    }

    // -------------------------------------------------------------------------
    // Render dispatch
    // -------------------------------------------------------------------------

    private render(): void {
        switch (this.view) {
            case 'loading':
                this.renderLoading();
                break;
            case 'login':
                this.renderLogin();
                break;
            case 'browser':
                this.renderBrowser();
                break;
        }
        this.playerBarEl.style.display = this.view === 'browser' ? 'flex' : 'none';
    }

    private renderLoading(): void {
        this.mainEl.replaceChildren(el('p', { class: 'status' }, ['Loading…']));
    }

    // -------------------------------------------------------------------------
    // Login view
    // -------------------------------------------------------------------------

    private renderLogin(): void {
        const form = el('form', { id: 'login-form' });
        const userInput = el('input', { type: 'text', name: 'username', placeholder: 'Username', autocomplete: 'username', required: '' }) as HTMLInputElement;
        const passInput = el('input', { type: 'password', name: 'password', placeholder: 'Password', autocomplete: 'current-password', required: '' }) as HTMLInputElement;
        const submitBtn = el('button', { type: 'submit' }, ['Sign in']) as HTMLButtonElement;

        form.append(userInput, passInput, submitBtn);

        if (this.loginError) {
            form.appendChild(el('p', { class: 'error' }, [this.loginError]));
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in…';
            void this.auth
                .login(userInput.value, passInput.value)
                .then(() => {
                    this.loginError = '';
                    return this.navigate('').then(() => this.restorePlayerState());
                })
                .catch((err: unknown) => {
                    this.loginError = (err as Error).message ?? 'Login failed';
                    this.render();
                });
        });

        const card = el('div', { class: 'login-card' });
        card.appendChild(el('h1', {}, ['S3 Media Player']));
        card.appendChild(form);

        this.mainEl.replaceChildren(card);
        userInput.focus();
    }

    // -------------------------------------------------------------------------
    // Browser view
    // -------------------------------------------------------------------------

    private renderBrowser(): void {
        const topBar = el('div', { class: 'top-bar' });
        topBar.appendChild(el('span', { class: 'app-title' }, ['S3 Media Player']));

        const signOutBtn = el('button', { class: 'sign-out-btn' }, ['Sign out']) as HTMLButtonElement;
        signOutBtn.addEventListener('click', () => this.signOut());
        topBar.appendChild(signOutBtn);

        const breadcrumb = this.buildBreadcrumb(this.browserState.prefix);

        let content: Node;
        if (this.browserState.loading) {
            content = el('p', { class: 'status' }, ['Loading…']);
        } else {
            content = this.buildFileList(this.browserState.items);
        }

        this.mainEl.replaceChildren(topBar, breadcrumb, content);
    }

    private buildBreadcrumb(prefix: string): HTMLElement {
        const nav = el('nav', { class: 'breadcrumb' });
        const parts: { label: string; prefix: string }[] = [
            { label: config.mediaBucket, prefix: '' },
        ];

        if (prefix) {
            let acc = '';
            for (const segment of prefix.split('/').filter(Boolean)) {
                acc += segment + '/';
                parts.push({ label: segment, prefix: acc });
            }
        }

        parts.forEach((part, i) => {
            if (i > 0) nav.appendChild(el('span', { class: 'sep' }, [' / ']));

            const link = el('a', { href: '#', class: i === parts.length - 1 ? 'current' : '' }, [part.label]);
            link.addEventListener('click', (e) => {
                e.preventDefault();
                void this.navigate(part.prefix);
            });
            nav.appendChild(link);
        });

        return nav;
    }

    private buildFileList(items: S3Item[]): HTMLElement {
        const ul = el('ul', { class: 'file-list' });

        if (items.length === 0) {
            ul.appendChild(el('li', { class: 'empty' }, ['No items found.']));
            return ul;
        }

        for (const item of items) {
            const icon = item.isFolder ? '📁' : '🎵';
            const li = el('li', { class: item.isFolder ? 'folder' : 'file' });
            li.appendChild(el('span', { class: 'icon' }, [icon]));
            li.appendChild(el('span', { class: 'name' }, [item.name]));

            if (this.player.currentTrackKey === item.key) {
                li.classList.add('playing');
            }

            if (item.isFolder) {
                li.addEventListener('click', () => void this.navigate(item.key));
            } else {
                li.addEventListener('click', () => void this.playItem(item));
            }

            ul.appendChild(li);
        }

        return ul;
    }

    // -------------------------------------------------------------------------
    // Player bar (built once, updated in-place)
    // -------------------------------------------------------------------------

    private buildPlayerBar(): HTMLElement {
        const bar = el('div', { id: 'player-bar' });
        bar.style.display = 'none';

        this.trackNameEl = el('span', { class: 'track-name' }, ['No track selected']);

        const prevBtn = el('button', { class: 'ctrl-btn', title: 'Previous' }, ['⏮']) as HTMLButtonElement;
        prevBtn.addEventListener('click', () => this.playPrev());

        this.playPauseBtn = el('button', { class: 'ctrl-btn play-pause' }, ['▶']) as HTMLButtonElement;
        this.playPauseBtn.addEventListener('click', () => {
            if (this.player.isPlaying) this.player.pause();
            else this.player.resume();
        });

        const nextBtn = el('button', { class: 'ctrl-btn', title: 'Next' }, ['⏭']) as HTMLButtonElement;
        nextBtn.addEventListener('click', () => this.playNext());

        this.seekBar = el('input', { type: 'range', class: 'seek-bar', min: '0', max: '100', value: '0', step: '0.1' }) as HTMLInputElement;
        this.seekBar.addEventListener('mousedown', () => { this.isSeeking = true; });
        this.seekBar.addEventListener('touchstart', () => { this.isSeeking = true; });
        this.seekBar.addEventListener('change', () => {
            this.isSeeking = false;
            this.player.seekToPct(Number.parseFloat(this.seekBar.value) / 100);
        });

        this.volumeBar = el('input', {
            type: 'range',
            class: 'volume-bar',
            min: '0',
            max: '100',
            value: String(Math.round(this.player.volume * 100)),
            step: '1',
            title: 'Volume',
            'aria-label': 'Volume',
        }) as HTMLInputElement;
        this.volumeBar.addEventListener('input', () => {
            this.player.setVolume(Number.parseFloat(this.volumeBar.value) / 100);
            this.savePlayerState();
        });

        this.timeEl = el('span', { class: 'time' }, ['0:00 / 0:00']);
        this.restoreNoticeEl = el('span', { class: 'restore-notice', 'aria-live': 'polite' });

        bar.append(this.trackNameEl, prevBtn, this.playPauseBtn, nextBtn, this.seekBar, this.timeEl, this.volumeBar, this.restoreNoticeEl);
        return bar;
    }

    private showRestoreNotice(message: string): void {
        if (!this.restoreNoticeEl) return;

        this.restoreNoticeEl.textContent = message;
        this.restoreNoticeEl.classList.add('visible');

        if (this.restoreNoticeTimer !== null) {
            window.clearTimeout(this.restoreNoticeTimer);
        }

        this.restoreNoticeTimer = window.setTimeout(() => {
            this.restoreNoticeEl.classList.remove('visible');
            this.restoreNoticeTimer = null;
        }, 3500);
    }

    private updatePlayerBar(): void {
        const key = this.player.currentTrackKey;
        this.trackNameEl.textContent = key ? (key.split('/').pop() ?? key) : 'No track selected';
        this.playPauseBtn.textContent = this.player.isPlaying ? '⏸' : '▶';

        // Refresh the highlight on the file list without a full re-render
        if (this.view === 'browser' && !this.browserState.loading) {
            const old = this.mainEl.querySelector('.file-list');
            if (old) old.replaceWith(this.buildFileList(this.browserState.items));
        }
    }

    private updateSeekBar(): void {
        if (this.isSeeking) return;

        const duration = this.player.duration;
        const current = this.player.currentTime;

        if (Number.isFinite(duration) && duration > 0) {
            this.seekBar.value = String((current / duration) * 100);
        }
        this.timeEl.textContent = `${fmtTime(current)} / ${fmtTime(duration)}`;
    }

    // -------------------------------------------------------------------------
    // Navigation & playback
    // -------------------------------------------------------------------------

    private async navigate(prefix: string): Promise<void> {
        this.browserState = { prefix, items: [], loading: true };
        this.view = 'browser';
        this.render();

        try {
            const items = await this.s3.list(prefix);
            this.browserState = { prefix, items, loading: false };
        } catch (err) {
            console.error('[App] Failed to list objects', err);
            this.browserState = { ...this.browserState, loading: false };
        }

        this.render();
    }

    private async playItem(item: S3Item): Promise<void> {
        try {
            await this.player.play(item.key);
        } catch (err) {
            console.error('[App] Playback failed', err);
        }
    }

    private playPrev(): void {
        const adjacent = this.adjacentTrack(-1);
        if (adjacent) void this.playItem(adjacent);
    }

    private playNext(): void {
        const adjacent = this.adjacentTrack(+1);
        if (adjacent) void this.playItem(adjacent);
    }

    private adjacentTrack(delta: -1 | 1): S3Item | null {
        const key = this.player.currentTrackKey;
        if (!key) return null;
        const files = this.browserState.items.filter((i) => !i.isFolder);
        const idx = files.findIndex((i) => i.key === key);
        if (idx === -1) return null;
        return files[idx + delta] ?? null;
    }

    private signOut(): void {
        this.savePlayerState();
        this.auth.logout();
        this.player.stop();
        this.loginError = '';
        this.view = 'login';
        this.render();
    }

    private applyPersistedVolume(): void {
        const state = this.readPersistedState();
        if (!state) return;
        this.player.setVolume(state.volume);
    }

    private savePlayerStateThrottled(): void {
        const now = Date.now();
        if (now - this.lastStateSaveAt < 1000) return;
        this.lastStateSaveAt = now;
        this.savePlayerState();
    }

    private savePlayerState(): void {
        const prev = this.readPersistedState();

        const state: PersistedPlayerState = {
            volume: this.player.volume,
            trackKey: this.player.currentTrackKey ?? prev?.trackKey ?? null,
            currentTime: this.player.currentTrackKey ? this.player.currentTime : (prev?.currentTime ?? 0),
            wasPlaying: this.player.currentTrackKey ? this.player.isPlaying : (prev?.wasPlaying ?? false),
        };

        this.writePersistedState(state);
    }

    private async restorePlayerState(): Promise<void> {
        const state = this.readPersistedState();
        if (!state) return;

        this.player.setVolume(state.volume);
        if (this.volumeBar) {
            this.volumeBar.value = String(Math.round(state.volume * 100));
        }

        if (!state.trackKey) return;

        try {
            await this.player.restore(state.trackKey, state.currentTime, state.wasPlaying);
            this.updatePlayerBar();
            this.updateSeekBar();
            this.showRestoreNotice(`Restored at ${fmtTime(this.player.currentTime)}`);
        } catch (err) {
            // Browser autoplay policies may block resume without a user gesture.
            // In that case restore in paused state so user can continue with one click.
            if (state.wasPlaying) {
                try {
                    await this.player.restore(state.trackKey, state.currentTime, false);
                    this.updatePlayerBar();
                    this.updateSeekBar();
                    this.showRestoreNotice(`Restored at ${fmtTime(this.player.currentTime)} (tap play to continue)`);
                    return;
                } catch {
                    // Fall through to the original error log.
                }
            }

            console.error('[App] Failed to restore playback state', err);
        }
    }

    private readPersistedState(): PersistedPlayerState | null {
        try {
            const raw = localStorage.getItem(PLAYER_STATE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as Partial<PersistedPlayerState>;

            const volume = typeof parsed.volume === 'number' ? parsed.volume : 1;
            const currentTime = typeof parsed.currentTime === 'number' ? Math.max(0, parsed.currentTime) : 0;
            const wasPlaying = parsed.wasPlaying === true;
            const trackKey = typeof parsed.trackKey === 'string' ? parsed.trackKey : null;

            return {
                volume: Math.min(1, Math.max(0, volume)),
                currentTime,
                wasPlaying,
                trackKey,
            };
        } catch {
            return null;
        }
    }

    private writePersistedState(state: PersistedPlayerState): void {
        try {
            localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state));
        } catch {
            // Ignore storage errors (private mode / quota / disabled storage)
        }
    }
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

/** Creates a DOM element with optional attributes and text/node children. */
function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs: Record<string, string> = {},
    children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        node.setAttribute(k, v);
    }
    for (const child of children) {
        node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
}

function fmtTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return `${m}:${s.toString().padStart(2, '0')}`;
}
