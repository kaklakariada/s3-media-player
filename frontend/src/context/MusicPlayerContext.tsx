import React, { useState } from 'react';
import { S3Object } from '../services/S3Service';

interface Props {
    children: JSX.Element
}

interface State {
    audioPlayer: HTMLAudioElement;
    currentTrack: S3Object | undefined;
    isPlaying: boolean;
}

const defaultState: State = {
    audioPlayer: new Audio(),
    isPlaying: false,
    currentTrack: undefined
};
const defaultStateSetter: React.Dispatch<React.SetStateAction<State>> = () => defaultState;

const MusicPlayerContext = React.createContext({ state: defaultState, setState: defaultStateSetter });

const MusicPlayerProvider = (props: Props) => {
    const [state, setState] = useState<State>({
        audioPlayer: new Audio(),
        isPlaying: false,
        currentTrack: undefined
    });
    return (
        <MusicPlayerContext.Provider value={{ state, setState }}>
            {props.children}
        </MusicPlayerContext.Provider>
    );
};

export { MusicPlayerContext, MusicPlayerProvider };
