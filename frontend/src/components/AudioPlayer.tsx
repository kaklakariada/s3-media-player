import React, { useState, useEffect, useRef, SyntheticEvent } from 'react';
import { Link, useHistory } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import Container from "@material-ui/core/Container";
import useMusicPlayer from "../hooks/useMusicPlayer";
import IconButton from '@material-ui/core/IconButton';
import FastRewindIcon from '@material-ui/icons/FastRewind';
import FastForwardIcon from '@material-ui/icons/FastForward';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import Typography from '@material-ui/core/Typography';
import { PlaylistItem } from '../services/PlaylistService';

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
    const history = useHistory();

    playerControl.registerPlayer({
        seekToTime: (seconds) => {
            if (playerRef.current) {
                playerRef.current.currentTime = seconds;
            }
        },
        play: () => {
            playerRef.current?.play();
        },
        pause: () => {
            playerRef.current?.pause();
        },
    });

    async function updateUrl(track: PlaylistItem | undefined) {
        if (track && !track.track.isFolder) {
            const url = await track.track.getUrl();
            console.log(`Current track has changed to ${track.track.fileName}. Playing URL...`);
            setUrl(url);
        } else {
            console.log("Invalid item, skip updating url", track);
            setUrl(undefined);
        }
    }

    useEffect(() => {
        updateUrl(currentTrack);
    }, [currentTrack]);

    function skip(skipSeconds: number) {
        if (!playerRef.current) {
            return;
        }
        const currentTime = playerRef.current.currentTime;
        const skipTo = currentTime + skipSeconds;
        if (skipTo > 0) {
            playerRef.current.currentTime = skipTo;
        }
    }

    function skipToPrevious() {
        if (currentTrack && currentTrack.prev) {
            startPlaying(currentTrack.prev);
        } else {
            console.log("No previous track. Stop playing.")
        }
    }

    function skipToNext() {
        if (currentTrack && currentTrack.next) {
            startPlaying(currentTrack.next);
        } else {
            console.log("No next track. Stop playing.")
        }
    }

    function fastRewind() {
        skip(-60);
    }

    function fastForward() {
        skip(60);
    }

    function startPlaying(track: PlaylistItem) {
        const nextKey = track.track.key;
        console.log(`Play track ${nextKey}`)
        history.push(`/${nextKey}`);
    }

    function onEndedEvent(event: SyntheticEvent<HTMLAudioElement>) {
        skipToNext();
    }

    function onErrorEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.error("Playing error: ", event);
    }

    function onAbortEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.warn("On Abort event: ", event);
    }

    const timeParam = playerRef.current ? `&time=${Math.trunc(playerRef.current.currentTime)}` : '';
    const currentTrackKey = currentTrack ? `/${currentTrack.track.key}${timeParam}` : '/';
    return (
        <Container className={classes.root}>
            <Typography>Current track: <Link to={currentTrackKey}>{currentTrackKey}</Link></Typography>
            <div>
                <IconButton onClick={skipToPrevious} disabled={!isPlaying}>
                    <SkipPreviousIcon />
                </IconButton>
                <IconButton onClick={fastRewind} disabled={!isPlaying}>
                    <FastRewindIcon />
                </IconButton>
                <IconButton onClick={playerControl.togglePlayPause}>
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton onClick={fastForward} disabled={!isPlaying}>
                    <FastForwardIcon />
                </IconButton>
                <IconButton onClick={skipToNext} disabled={!isPlaying}>
                    <SkipNextIcon />
                </IconButton>
            </div>
            <audio ref={playerRef} className={classes.player} src={url} crossOrigin="anonymous" autoPlay={true} controls={true}
                onPlay={playerControl.onPlaying}
                onPause={playerControl.onPause}
                onEnded={onEndedEvent} onError={onErrorEvent} onAbort={onAbortEvent} />
        </Container>
    )
}

export default PlayerControls