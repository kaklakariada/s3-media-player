import React, { useState, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import Container from "@material-ui/core/Container";
import useMusicPlayer from "../hooks/useMusicPlayer";
import IconButton from '@material-ui/core/IconButton';
import FastForwardIcon from '@material-ui/icons/FastForward';
import FastRewindIcon from '@material-ui/icons/FastRewind';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import Typography from '@material-ui/core/Typography';
import { S3Object } from '../services/S3Service';

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
    const { currentTrack, playerControl, isPlaying } = useMusicPlayer();
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

    async function updateUrl(track: S3Object | undefined) {
        if (track) {
            setUrl(await track.getUrl());
        } else {
            setUrl(undefined);
        }
    }

    useEffect(() => {
        updateUrl(currentTrack);
    }, [currentTrack]);

    function skip(skipSeconds: number) {
        if (playerRef.current) {
            const currentTime = playerRef.current.currentTime;
            playerRef.current.currentTime = currentTime + skipSeconds;
        }
    }

    function fastRewind() {
        skip(-60);
    }

    function fastForward() {
        skip(60);
    }

    const timeParam = playerRef.current ? `&time=${Math.trunc(playerRef.current.currentTime)}` : '';
    const currentTrackKey = currentTrack ? `/${currentTrack.key}${timeParam}` : '/';
    return (
        <Container className={classes.root}>
            <Typography>Current track: <Link to={currentTrackKey}>{currentTrackKey}</Link></Typography>
            <div>
                <IconButton onClick={fastRewind} disabled={!isPlaying}>
                    <FastRewindIcon />
                </IconButton>
                <IconButton onClick={playerControl.togglePlayPause} disabled={true}>
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton onClick={fastForward} disabled={!isPlaying}>
                    <FastForwardIcon />
                </IconButton>
            </div>
            <audio ref={playerRef} className={classes.player} src={url} crossOrigin="anonymous" autoPlay={true} controls={true}
                onPlay={playerControl.onPlaying}
                onPause={playerControl.onPause}
                onEnded={playerControl.currentTrackHasEnded} />
        </Container>
    )
}

export default PlayerControls