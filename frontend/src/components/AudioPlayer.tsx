import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from "@material-ui/core/Container";
import useMusicPlayer from "../hooks/useMusicPlayer";

const useStyles = makeStyles(theme => ({
    root: {
        'text-align': 'left',
        'font-family': '"Roboto", "Helvetica", "Arial", sans-serif',
        'font-weight': 400,
        'line-height': 1.43,
    },
    player: {
        width: '50%'
    }
}));

const PlayerControls: React.FC = () => {
    const { currentTrack, playerControl } = useMusicPlayer();
    const [url, setUrl] = useState<string | undefined>(undefined);
    const playerRef = useRef<HTMLAudioElement>(null);
    const classes = useStyles();

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
        <Container className={classes.root}>
            <div>Current track: {currentTrack && currentTrack.key}</div>
            <audio ref={playerRef} className={classes.player} src={url} crossOrigin="anonymous" autoPlay={true} controls={true}
                onPlay={playerControl.onPlaying}
                onPause={playerControl.onPause}
                onEnded={playerControl.currentTrackHasEnded} />
        </Container>
    )
}

export default PlayerControls