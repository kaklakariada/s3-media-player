import { useContext } from 'react';
import { MusicPlayerContext } from "../context/MusicPlayerContext";

const useMusicPlayer = () => {
  const { currentTrackState, playingState,  playerControl } = useContext(MusicPlayerContext);

  return {
    currentTrack: currentTrackState.currentTrack,
    currentTime: playingState.currentTime,
    isPlaying: playingState.isPlaying,
    playerControl,
  }
};

export default useMusicPlayer;
