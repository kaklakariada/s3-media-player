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
import { PlayerControl } from '../context/MusicPlayerContext';
import { mediaSessionService } from '../services/MediaSessionService';

const useStyles = makeStyles(theme => ({
    root: {
        'text-align': 'left',
        'font-family': '"Roboto", "Helvetica", "Arial", sans-serif',
        'font-weight': 400,
        'line-height': 1.43,
    },
    player: {
        //width: '50%'
    }
}));

const CurrentTrackLink: React.FC<{}> = () => {
    const { currentTrack } = useMusicPlayer();
    const currentTime = undefined;

    if (!currentTrack) {
        return <Typography>No track playing currently</Typography>
    }
    const timeParam = currentTime ? `&time=${Math.trunc(currentTime)}` : '';
    const currentTrackKey = `/${currentTrack.track.key}${timeParam}`;
    return <Typography>Playing <Link to={currentTrackKey}>{currentTrack.track.key} @ {currentTime}s</Link></Typography>;
}

function registerPlayer(playerRef: HTMLAudioElement, playerControl: PlayerControl) {
    playerControl.registerPlayer({
        seekToTime: (seconds: number) => {
            playerRef.currentTime = seconds;
        },
        play: () => {
            playerRef.play();
        },
        pause: () => {
            playerRef.pause();
        }
    });
}

const PlayerControls: React.FC = () => {
    const { currentTrack, playerControl, isPlaying } = useMusicPlayer();
    const [url, setUrl] = useState<string | undefined>(undefined);
    const playerRef = useRef<HTMLAudioElement>(null);
    const classes = useStyles();
    const history = useHistory();

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
        mediaSessionService.updateCurrentTrack(currentTrack);
    }, [currentTrack]);

    useEffect(() => {
        if (playerRef.current) {
            registerPlayer(playerRef.current, playerControl);
            mediaSessionService.registerPlayer(playerRef.current, playerControl);
        }
    }, [playerControl]);

    function onEndedEvent(event: SyntheticEvent<HTMLAudioElement>) {
        playerControl.skipToNext();
    }

    function onErrorEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.error("Playing error: ", event);
    }

    function onAbortEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.warn("On Abort event: ", event);
    }

    function onTimeUpdate(event: SyntheticEvent<HTMLAudioElement>) {
        if (playerRef.current) {
            const time = playerRef.current?.currentTime;
            playerControl.onTimeChanged(time);
        }
    }

    return (
        <Container className={classes.root}>
            <CurrentTrackLink />
            <div>
                <IconButton onClick={playerControl.skipToPrevious} disabled={!isPlaying}>
                    <SkipPreviousIcon />
                </IconButton>
                <IconButton onClick={playerControl.fastRewind} disabled={!isPlaying}>
                    <FastRewindIcon />
                </IconButton>
                <IconButton onClick={playerControl.togglePlayPause}>
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton onClick={playerControl.fastForward} disabled={!isPlaying}>
                    <FastForwardIcon />
                </IconButton>
                <IconButton onClick={playerControl.skipToNext} disabled={!isPlaying}>
                    <SkipNextIcon />
                </IconButton>
            </div>
            <audio ref={playerRef} className={classes.player} src={url} crossOrigin="anonymous" autoPlay={true} controls={true}
                onTimeUpdate={onTimeUpdate}
                onPlay={playerControl.onPlaying}
                onPause={playerControl.onPause}
                onEnded={onEndedEvent} onError={onErrorEvent} onAbort={onAbortEvent} />
        </Container>
    )
}

export default PlayerControls

