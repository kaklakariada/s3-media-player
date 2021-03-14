import React, { useState, useEffect, useRef, SyntheticEvent } from 'react';
import { Link, useHistory } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import Container from "@material-ui/core/Container";
import useMusicPlayer from "../hooks/useMusicPlayer";
import IconButton from '@material-ui/core/IconButton';
import FastForwardIcon from '@material-ui/icons/FastForward';
import FastRewindIcon from '@material-ui/icons/FastRewind';
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

    function onEndedEvent(event: SyntheticEvent<HTMLAudioElement>) {
        if (currentTrack && currentTrack.next) {
            const nextKey = currentTrack.next.track.key;
            console.log(`Play next track ${nextKey}`)
            history.push(`/${nextKey}`);
        } else {
            console.log("No next track. Stop playing.")
        }
    }

    function onErrorEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.error("Playing error: ", event);
    }

    function onAbortEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.warn("On Abort event: ", event);
    }

    function onProgressEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.log("On progress event: ", event);
    }
    function onTimeUpdateEvent(event: SyntheticEvent<HTMLAudioElement>) {
    }
    function onSuspendEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.log("On suspend event: ", event);
    }
    function onWaitingEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.log("On waiting event: ", event);
    }
    function onEmptiedEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.log("On emptied event: ", event);
    }
    function onDurationChangeEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.log("On durationchanged event: ", event);
    }

    const timeParam = playerRef.current ? `&time=${Math.trunc(playerRef.current.currentTime)}` : '';
    const currentTrackKey = currentTrack ? `/${currentTrack.track.key}${timeParam}` : '/';
    return (
        <Container className={classes.root}>
            <Typography>Current track: <Link to={currentTrackKey}>{currentTrackKey}</Link></Typography>
            <div>
                <IconButton onClick={fastRewind} disabled={!isPlaying}>
                    <FastRewindIcon />
                </IconButton>
                <IconButton onClick={playerControl.togglePlayPause}>
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton onClick={fastForward} disabled={!isPlaying}>
                    <FastForwardIcon />
                </IconButton>
            </div>
            <audio ref={playerRef} className={classes.player} src={url} crossOrigin="anonymous" autoPlay={true} controls={true}
                onPlay={playerControl.onPlaying}
                onPause={playerControl.onPause}
                onEnded={onEndedEvent} onError={onErrorEvent} onAbort={onAbortEvent}
                onProgress={onProgressEvent} onTimeUpdate={onTimeUpdateEvent} onSuspend={onSuspendEvent} onWaiting={onWaitingEvent}
                onEmptied={onEmptiedEvent} onDurationChange={onDurationChangeEvent} />
        </Container>
    )
}

export default PlayerControls