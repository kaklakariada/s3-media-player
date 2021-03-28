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
    #currentTime: number | undefined;
    #setState: StateSetter;
    #player: PlayerCallback | undefined;

    constructor(state: State, setState: StateSetter) {
        console.log("Create new player controle with state ", state);
        this.#state = state;
        this.#setState = setState;

        this.registerPlayer = this.registerPlayer.bind(this);
        this.playTrack = this.playTrack.bind(this);

        this.fastRewind = this.fastRewind.bind(this);
        this.fastForward = this.fastForward.bind(this);
        this.skip = this.skip.bind(this);
        this.seekToTime = this.seekToTime.bind(this);

        this.skipToPrevious = this.skipToPrevious.bind(this);
        this.skipToNext = this.skipToNext.bind(this);

        this.onPlaying = this.onPlaying.bind(this);
        this.onPause = this.onPause.bind(this);
        this.togglePlayPause = this.togglePlayPause.bind(this);
        this.onTimeChanged = this.onTimeChanged.bind(this);
        this.setPlayingState = this.setPlayingState.bind(this);
        
        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.stop = this.stop.bind(this);
    }

    registerPlayer(player: PlayerCallback) {
        console.log("Register player", player);
        this.#player = player;
    }

    async playTrack(track: PlaylistItem) {
        if (this.#state.currentTrack && this.#state.currentTrack.equals(track)) {
            return;
        }
        console.log("Track changed to ", track);
        this.#setState(state => ({ ...state, currentTrack: track }));
    }

    fastRewind() {
        this.skip(-60);
    }

    fastForward() {
        this.skip(60);
    }

    skip(skipSeconds: number) {
        const currentTime = this.#currentTime || 0;
        const skipTo = currentTime + skipSeconds;
        console.log(`Skip ${skipSeconds}s to ${skipTo}s`);
        if (skipTo > 0) {
            this.seekToTime(skipTo);
        }
    }

    seekToTime(seconds: number) {
        if (this.#player) {
            console.log("Seek to", seconds);
            this.#player.seekToTime(seconds);
        }
    }

    skipToPrevious() {
        if (this.#state.currentTrack && this.#state.currentTrack.prev) {
            this.playTrack(this.#state.currentTrack.prev);
        } else {
            console.log("No previous track. Stop playing.")
        }
    }

    skipToNext() {
        if (this.#state.currentTrack && this.#state.currentTrack.next) {
            this.playTrack(this.#state.currentTrack.next);
        } else {
            console.log("No next track. Stop playing.")
        }
    }

    stop() {
        this.pause();
    }
    play() {
        this.#player?.play();
    }
    pause() {
        this.#player?.pause();
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
        this.#currentTime = currentTime;
    }

    get currentTime() {
        return this.#currentTime;
    }

    setPlayingState(playing: boolean) {
        console.log("Set playing state", playing);
        this.#setState(state => ({ ...state, isPlaying: playing }));
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
    console.log("Create music player provider with props", props);
    return (
        <MusicPlayerContext.Provider value={{ state, setState, playerControl: new PlayerControl(state, setState) }}>
            {props.children}
        </MusicPlayerContext.Provider>
    );
};

export { MusicPlayerContext, MusicPlayerProvider };

function createDefaultContext(): Context {
    console.log("Create default context");
    const defaultState = createDefaultState();
    const defaultStateSetter: StateSetter = () => defaultState;
    const defaultPlayerControl = new PlayerControl(defaultState, defaultStateSetter);
    return { state: defaultState, setState: defaultStateSetter, playerControl: defaultPlayerControl };
}

function createDefaultState(): State {
    return {
        currentTrack: undefined,
        isPlaying: false,
    };
}
