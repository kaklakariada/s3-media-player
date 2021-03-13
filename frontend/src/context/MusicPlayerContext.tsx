import React, { useState } from 'react';
import { PlaylistItem } from '../services/PlaylistService';

interface Props {
    children: JSX.Element
}

interface State {
    currentTrack: PlaylistItem | undefined;
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
        this.onPlaying = this.onPlaying.bind(this);
        this.onPause = this.onPause.bind(this);
        this.seekToTime = this.seekToTime.bind(this);
        this.togglePlayPause = this.togglePlayPause.bind(this);
    }

    registerPlayer(player: PlayerCallback) {
        this.#player = player;
    }

    async playTrack(track: PlaylistItem) {
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
    
    setPlayingState(playing: boolean) {
        this.#setState(state => ({ ...state, isPlaying: playing }));
    }

    currentTrackHasEnded() {
        const next = this.#state.currentTrack?.next;
        if(next) {
            console.log("Playback has finished, playing next ", next);
            this.#setState(state => ({...state, currentTrack: next}))
        } else {
            console.log("Playback has finished, end of playlist.");
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
    const [state, setState] = useState<State>({
        isPlaying: false,
        currentTrack: undefined
    });
    return (
        <MusicPlayerContext.Provider value={{ state, setState, playerControl: new PlayerControl(state, setState) }}>
            {props.children}
        </MusicPlayerContext.Provider>
    );
};

export { MusicPlayerContext, MusicPlayerProvider };

function createDefaultContext(): Context {
    const defaultState: State = { isPlaying: false, currentTrack: undefined };
    const defaultStateSetter: StateSetter = () => defaultState;
    const defaultPlayerControl = new PlayerControl(defaultState, defaultStateSetter);
    return { state: defaultState, setState: defaultStateSetter, playerControl: defaultPlayerControl };
}
