import React, { useState, useEffect, useRef, useCallback } from 'react';
import { S3Object } from "../services/S3Service";
import useMusicPlayer from "../hooks/useMusicPlayer";
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';


const PlayerControls: React.FC = () => {
    const { isPlaying, currentTrack, playerControl } = useMusicPlayer();
    const [url, setUrl] = useState<string | undefined>(undefined);
    const playerRef = useRef<HTMLAudioElement>(null);

    playerControl.registerPlayer({
        seekToTime: (seconds) => {
            if (playerRef.current) {
                playerRef.current.currentTime = seconds;
            }
        }
    });

    useEffect(() => {
        (async function fetchUrl() {
            console.log(`Fetch url for current track ${currentTrack}`);
            if (currentTrack) {
                setUrl(await currentTrack.getUrl());
            } else {
                setUrl(undefined);
            }
        })();
    }, [currentTrack]);
    console.log(`Render with url ${!url}, player ref ${playerRef}`);
    return (
        <div>
            <div>{currentTrack && currentTrack.key}</div>
            {url ? <audio ref={playerRef} src={url} crossOrigin="anonymous" autoPlay={true} controls={true}
                onPlay={playerControl.onPlaying}
                onPause={playerControl.onPause}
                onEnded={playerControl.currentTrackHasEnded} />
                : <>Select track</>}
        </div>
    )
}

export default PlayerControls