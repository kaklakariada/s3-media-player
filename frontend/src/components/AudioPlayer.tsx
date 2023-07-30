import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import Container from "@mui/material/Container";
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import React, { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import useMusicPlayer from "../hooks/useMusicPlayer";
import { PlaylistItem } from '../services/PlaylistService';

import { styled } from "@mui/system";


const CurrentTrackLink: React.FC<{}> = () => {
    const { currentTrack, currentTime } = useMusicPlayer();

    if (!currentTrack) {
        return <Typography>No track playing currently</Typography>
    }
    const timeParam = currentTime ? `&time=${Math.trunc(currentTime)}` : '';
    const currentTrackKey = `/${currentTrack.track.key}${timeParam}`;
    return <Typography>Playing <Link to={currentTrackKey}>{currentTrack.track.key} @ {currentTime}s</Link></Typography>;
}

const PlayerControls: React.FC = () => {
    const { currentTrack, playerControl, isPlaying } = useMusicPlayer();
    const [url, setUrl] = useState<string | undefined>(undefined);
    const playerRef = useRef<HTMLAudioElement>(null);
    const navigate = useNavigate();

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
            const trackUrl = await track.track.getUrl();
            console.log(`Current track has changed to ${track.track.fileName}. Playing URL...`);
            setUrl(trackUrl);
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
        navigate(`/${nextKey}`);
    }

    function onEndedEvent(_event: SyntheticEvent<HTMLAudioElement>) {
        skipToNext();
    }

    function onErrorEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.error("Playing error: ", event);
    }

    function onAbortEvent(event: SyntheticEvent<HTMLAudioElement>) {
        console.warn("On Abort event: ", event);
    }

    function onTimeUpdate(_event: SyntheticEvent<HTMLAudioElement>) {
        if (playerRef.current) {
            const time = playerRef.current?.currentTime;
            playerControl.onTimeChanged(Math.trunc(time));
        }
    }

    const Audio = styled('audio')({
        width: '50%'
    });

    return (
        <Container sx={{
            textAlign: 'left',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 400,
            lineHeight: 1.43,
        }}>
            <CurrentTrackLink />
            <div>
                <IconButton onClick={skipToPrevious} disabled={!isPlaying} size="large">
                    <SkipPreviousIcon />
                </IconButton>
                <IconButton onClick={fastRewind} disabled={!isPlaying} size="large">
                    <FastRewindIcon />
                </IconButton>
                <IconButton onClick={playerControl.togglePlayPause} size="large">
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton onClick={fastForward} disabled={!isPlaying} size="large">
                    <FastForwardIcon />
                </IconButton>
                <IconButton onClick={skipToNext} disabled={!isPlaying} size="large">
                    <SkipNextIcon />
                </IconButton>
            </div>
            <Audio ref={playerRef} src={url} crossOrigin="anonymous"
                autoPlay={true}
                controls={true}
                onTimeUpdate={onTimeUpdate}
                /*onPlay={playerControl.onPlaying}
                onPause={playerControl.onPause}*/
                onEnded={onEndedEvent} onError={onErrorEvent} onAbort={onAbortEvent} />
        </Container >
    );
}

export default PlayerControls