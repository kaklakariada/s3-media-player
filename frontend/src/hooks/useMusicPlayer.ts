import { useContext } from 'react';
import { MusicPlayerContext } from "../context/MusicPlayerContext";
import { S3Object } from '../services/S3Service';

const useMusicPlayer = () => {
  const { state, setState, playerControl } = useContext(MusicPlayerContext);

  return {
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    playerControl
  }
};

export default useMusicPlayer;
