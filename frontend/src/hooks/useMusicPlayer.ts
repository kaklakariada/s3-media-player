import { useContext } from 'react';
import { MusicPlayerContext } from "../context/MusicPlayerContext";

const useMusicPlayer = () => {
  const { state, playerControl } = useContext(MusicPlayerContext);

  return {
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    playerControl
  }
};

export default useMusicPlayer;
