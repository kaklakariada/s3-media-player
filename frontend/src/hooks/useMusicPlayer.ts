import { useContext } from 'react';
import { MusicPlayerContext } from "../context/MusicPlayerContext";
import { S3Object } from '../services/S3Service';

const useMusicPlayer = () => {
  const {state, setState} = useContext(MusicPlayerContext);

  async function playTrack(track: S3Object) {
    if (track === state.currentTrack) {
      togglePlay();
    } else {
      state.audioPlayer.pause();
      state.audioPlayer = new Audio(await track.getUrl());
      state.audioPlayer.play();
      setState(state => ({ ...state, currentTrack:track, isPlaying: true }));
    }
  }

  function togglePlay() {
    if (state.isPlaying) {
      state.audioPlayer.pause();
    } else {
      state.audioPlayer.play();
    }
    setState(state => ({ ...state, isPlaying: !state.isPlaying }));
  }

  return {
    playTrack,
    togglePlay,
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying
  }
};

export default useMusicPlayer;
