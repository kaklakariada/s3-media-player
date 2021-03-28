import { PlayerControl } from "../context/MusicPlayerContext";
import { PlaylistItem } from "./PlaylistService";

export interface MediaSessionService {
    registerPlayer: (audioElement: HTMLAudioElement, playerControl: PlayerControl) => void;
    updateCurrentTrack: (currentTrack: Readonly<PlaylistItem> | undefined) => void;
    updatePlaybackState: (state: MediaSessionPlaybackState) => void;
}

function createMediaService(mediaSession: MediaSession): MediaSessionService {

    if (!mediaSession.metadata) {
        mediaSession.metadata = new MediaMetadata({});
    }
    const metadata = mediaSession.metadata;

    return {
        registerPlayer: (audioElement, playerControl) => {
            mediaSession.setActionHandler("seekto", details => {
                console.log(`Action ${details.action}: `, details);
                playerControl.seekToTime(details.seekTime);
            });
            mediaSession.setActionHandler("seekforward", details => {
                console.log(`Action ${details.action}: `, details);
                playerControl.fastForward();
            });
            mediaSession.setActionHandler("seekbackward", details => {
                console.log(`Action ${details.action}: `, details);
                playerControl.fastRewind();
            });
            mediaSession.setActionHandler("nexttrack", details => {
                console.log(`Action ${details.action}: `, details);
                playerControl.skipToNext();
            });
            mediaSession.setActionHandler("previoustrack", details => {
                console.log(`Action ${details.action}: `, details);
                playerControl.skipToPrevious();
            });
            mediaSession.setActionHandler("pause", details => {
                console.log(`Action ${details.action}: `, details);
                playerControl.pause();
            });
            mediaSession.setActionHandler("play", details => {
                console.log(`Action ${details.action}: `, details);
                playerControl.play();
            });
            mediaSession.setActionHandler("stop", details => {
                console.log(`Action ${details.action}: `, details);
                playerControl.stop();
            });
        },
        updateCurrentTrack: (currentTrack) => {
            if (currentTrack) {
                metadata.album = currentTrack.track.getParentFolder().key
                metadata.title = currentTrack.track.fileName;
            } else {
                metadata.album = "";
                metadata.title = "";
            }
        },
        updatePlaybackState: (state) => {
            mediaSession.playbackState = state;
        },
    };
}
function createDummyMediaService(): MediaSessionService {
    return {
        updateCurrentTrack: () => { },
        registerPlayer: () => { },
        updatePlaybackState: () => { },
    };
}

export const mediaSessionService: MediaSessionService = navigator.mediaSession ? createMediaService(navigator.mediaSession) : createDummyMediaService();
