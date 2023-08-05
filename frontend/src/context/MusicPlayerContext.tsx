import React, { useState } from 'react';
import { PlaylistItem } from '../services/PlaylistService';

interface Props {
    children: React.JSX.Element
}

interface State {
    currentTrack: PlaylistItem | undefined;
    currentTime: number | undefined;
    isPlaying: boolean;
}

interface PlayerCallback {
    seekToTime: (seconds: number) => void;
    play: () => void;
    pause: () => void;
}

type StateSetter = React.Dispatch<React.SetStateAction<State>>;

export class PlayerControl {
    #state: State;
    #setState: StateSetter;
    #player: PlayerCallback | undefined;

    constructor(state: State, setState: StateSetter) {
        this.#state = state;
        this.#setState = setState;

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
        if (this.#state?.currentTrack && this.#state.currentTrack.equals(track)) {
            return;
        }
        console.log("Track changed to ", track);
        this.#setState(state => ({ ...state, currentTrack: track }));
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
        this.setPlayingState(!this.#state.isPlaying);
    }

    onTimeChanged(currentTime: number) {
        this.#setState(state => ({ ...state, currentTime }));
    }

    setPlayingState(playing: boolean) {
        console.log("Set playing state ", playing);
        if (playing) {
            this.#setState(state => ({ ...state, isPlaying: playing }));
        } else {
            this.#setState(state => ({ ...state, isPlaying: playing, currentTime: undefined }));
        }
    }
}

interface Context {
    state: State;
    setState: StateSetter;
    playerControl: PlayerControl;
}
const initialContext: Context = createDefaultContext();
const MusicPlayerContext = React.createContext(initialContext);

const MusicPlayerProvider = (props: Props) => {
    const [state, setState] = useState<State>(createDefaultState());
    return (
        <MusicPlayerContext.Provider value={{ state, setState, playerControl: new PlayerControl(state, setState) }}>
            {props.children}
        </MusicPlayerContext.Provider>
    );
};

export { MusicPlayerContext, MusicPlayerProvider };

function createDefaultContext(): Context {
    const defaultState = createDefaultState();
    const defaultStateSetter: StateSetter = () => defaultState;
    const defaultPlayerControl = new PlayerControl(defaultState, defaultStateSetter);
    return { state: defaultState, setState: defaultStateSetter, playerControl: defaultPlayerControl };
}

function createDefaultState(): State {
    return {
        currentTrack: undefined,
        currentTime: undefined,
        isPlaying: false,
    };
}
