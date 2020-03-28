import React, { useState } from 'react';
import { S3Object } from "../services/S3Service";
import useMusicPlayer from "../hooks/useMusicPlayer";
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';


const PlayerControls: React.FC = () => {
    const { isPlaying, currentTrack, togglePlay } = useMusicPlayer();
    return (
        <>
            <div className="box controls has-background-grey-dark">
                <div className="current-track has-text-light">
                    {currentTrack ? currentTrack.key : '(no track)'}
                </div>
                <div>
                    {}
                    {/*<button className="button has-text-light has-background-grey-dark" onClick={playPreviousTrack} disabled={!currentTrack}>
              <FontAwesomeIcon icon={faStepBackward} />
    </button> 
                    <button className="button has-text-light has-background-grey-dark" onClick={togglePlay} disabled={!currentTrack}>
                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </button>
    */}
                    {/*

            <button className="button has-text-light has-background-grey-dark" onClick={playNextTrack} disabled={!currentTrack}>
              <FontAwesomeIcon icon={faStepForward} />
            </button>
            */}
                </div>
            </div>
        </>
    )
}

export default PlayerControls