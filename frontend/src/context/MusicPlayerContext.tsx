import React, { useMemo, useState } from 'react';
import { PlaylistItem } from '../services/PlaylistService';

interface Props {
    children: React.JSX.Element
}

interface TrackState {
    currentTrack: PlaylistItem | undefined;
}

interface PlayingState {
    currentTime: number | undefined;
    isPlaying: boolean;
}

interface PlayerCallback {
    seekToTime: (seconds: number) => void;
    play: () => void;
    pause: () => void;
}

type TrackStateSetter = React.Dispatch<React.SetStateAction<TrackState>>;
type PlayingStateSetter = React.Dispatch<React.SetStateAction<PlayingState>>;

export class PlayerControl {
    #trackState: TrackState;
    #setTrackState: TrackStateSetter;
    #playingState: PlayingState;
    #setPlayingState: PlayingStateSetter;
    #player: PlayerCallback | undefined;

    constructor(state: TrackState, setState: TrackStateSetter, playingState: PlayingState, setPlayingState: PlayingStateSetter) {
        this.#trackState = state;
        this.#setTrackState = setState;
        this.#playingState = playingState;
        this.#setPlayingState = setPlayingState;

        this.registerPlayer = this.registerPlayer.bind(this);
        this.playTrack = this.playTrack.bind(this);
        this.seekToTime = this.seekToTime.bind(this);
        this.onPlaying = this.onPlaying.bind(this);
        this.onPause = this.onPause.bind(this);
        this.togglePlayPause = this.togglePlayPause.bind(this);
        this.onTimeChanged = this.onTimeChanged.bind(this);
        this.setPlayingState = this.setPlayingState.bind(this);
    }

    registerPlayer(player: PlayerCallback) {
        this.#player = player;
    }

    async playTrack(track: PlaylistItem) {
        if (this.#trackState?.currentTrack && this.#trackState.currentTrack.equals(track)) {
            return;
        }
        console.log("Track changed to ", track);
        this.#setTrackState(state => ({ ...state, currentTrack: track }));
    }

    seekToTime(seconds: number) {
        if (this.#player) {
            this.#player.seekToTime(seconds);
        }
    }

    onPlaying() {
        this.setPlayingState(true);
    }

    onPause() {
        this.setPlayingState(false);
    }

    togglePlayPause() {
        this.setPlayingState(!this.#playingState.isPlaying);
    }

    onTimeChanged(currentTime: number) {
        this.#setPlayingState(state => ({ ...state, currentTime }));
    }

    setPlayingState(playing: boolean) {
        if (playing === this.#playingState.isPlaying) {
            return
        }
        console.log("Set playing state ", playing, this.#playingState);
        if (playing) {
            this.#setPlayingState(state => ({ ...state, isPlaying: playing }));
        } else {
            this.#setPlayingState(state => ({ ...state, isPlaying: playing, currentTime: undefined }));
        }
    }
}

interface Context {
    currentTrackState: TrackState;
    playingState: PlayingState;
    setTrackState: TrackStateSetter;
    playerControl: PlayerControl;
}
const initialContext: Context = createDefaultContext();
const MusicPlayerContext = React.createContext(initialContext);

const MusicPlayerProvider = (props: Props) => {
    const [trackState, setTrackState] = useState<TrackState>(createDefaultState());
    const [playingState, setPlayingState] = useState<PlayingState>({ currentTime: undefined, isPlaying: false });
    const value = useMemo(() => {
        console.log(`Create new provider for state`, trackState, playingState);
        return {
            currentTrackState: trackState, setTrackState,
            playingState,
            playerControl: new PlayerControl(trackState, setTrackState, playingState, setPlayingState)
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackState]);
    return (
        <MusicPlayerContext.Provider value={value}>
            {props.children}
        </MusicPlayerContext.Provider>
    );
};

export { MusicPlayerContext, MusicPlayerProvider };

function createDefaultContext(): Context {
    const defaultState = createDefaultState();
    const playingState: PlayingState = { currentTime: undefined, isPlaying: false };
    const defaultStateSetter: TrackStateSetter = () => defaultState;
    const defaultPlayingStateSetter: PlayingStateSetter = () => playingState;
    const defaultPlayerControl = new PlayerControl(defaultState, defaultStateSetter, playingState, defaultPlayingStateSetter);
    return { currentTrackState: defaultState, playingState, setTrackState: defaultStateSetter, playerControl: defaultPlayerControl };
}

function createDefaultState(): TrackState {
    return {
        currentTrack: undefined,
    };
}
