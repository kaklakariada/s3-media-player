import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Container from "@material-ui/core/Container";
import CircularProgress from "@material-ui/core/CircularProgress";
import { S3Service, S3Object } from "../services/S3Service";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import FolderIcon from '@material-ui/icons/Folder';
import AudiotrackIcon from '@material-ui/icons/Audiotrack';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import KeyboardReturnIcon from '@material-ui/icons/KeyboardReturn';
import useMusicPlayer from "../hooks/useMusicPlayer";
import { Playlist, PlaylistItem, PlaylistService } from "../services/PlaylistService";
import { Typography } from "@material-ui/core";

const s3 = new S3Service();
const playlistService = new PlaylistService();

const FolderListItem: React.FC<{ folder: S3Object }> = ({ folder }) => {
    return (<ListItem button component={Link} to={`/${folder.key}`}>
        <ListItemIcon>
            <FolderIcon />
        </ListItemIcon>
        <ListItemText primary={folder.fileName} />
    </ListItem>);
}

const OtherFileItem: React.FC<{ file: PlaylistItem }> = ({ file }) => {
    return (<ListItem>
        <ListItemIcon>
            <InsertDriveFileIcon />
        </ListItemIcon>
        <ListItemText primary={file.track.fileName} />
    </ListItem>);
}

const AudioFileItem: React.FC<{ file: PlaylistItem }> = ({ file }) => {
    const { currentTrack, isPlaying } = useMusicPlayer();
    const isCurrentTrack = file.equals(currentTrack);
    const state = isCurrentTrack ? (isPlaying ? 'playing' : 'paused') : '';
    return (<ListItem button component={Link} to={`/${file.track.key}`}>
        <ListItemIcon>
            <AudiotrackIcon />
        </ListItemIcon>
        <ListItemText primary={file.track.fileName} secondary={state} />
    </ListItem>);
}

const MediaList: React.FC<{ bucket: string, path: string, time?: number }> = ({ bucket, path, time }) => {
    const [playlist, setPlaylist] = useState<Playlist | undefined>(undefined);
    const [error, setError] = useState<any | undefined>(undefined);
    const { playerControl } = useMusicPlayer();

    const isFolder = path === '' || path.indexOf('/') < 0 || path.endsWith('/');
    const folderPath = isFolder ? path : path.substr(0, path.lastIndexOf('/') + 1);
    const currentFolder = s3.getFolder(bucket, folderPath);

    useEffect(() => {
        (async function fetchData() {
            setPlaylist(undefined);
            try {
                const media = await s3.listMedia(bucket, currentFolder.key);
                setPlaylist(playlistService.createPlaylist(media));
                setError(undefined);
            } catch (error) {
                console.error("Error listing media bucket", error);
                setPlaylist(undefined);
                setError(error);
            }
        })();
    }, [bucket, currentFolder.key]);

    useEffect(() => {
        if(!playlist) {
            return;
        }
        const item = playlist.findItem(path);
        if (!item || item.track.isFolder) {
            return;
        }
        playerControl.playTrack(item);
    }, [path, playerControl, playlist]);

    useEffect(() => {
        if (time) {
            console.log("Seek to time ", time);
            playerControl.seekToTime(time);
        }
    }, [playerControl, time]);


    const isAudioFile = (object: S3Object) => object.key.toLowerCase().endsWith('.mp3');

    function renderItem(object: PlaylistItem) {
        if (object.track.isFolder) {
            return <FolderListItem key={object.track.key} folder={object.track} />;
        }
        if (isAudioFile(object.track)) {
            return <AudioFileItem key={object.track.key} file={object} />
        }
        return <OtherFileItem key={object.track.key} file={object} />
    }

    const parentPath = `/${currentFolder.getParentFolder().key}`;
    const upOneLevel: JSX.Element = (
        <ListItem button component={Link} to={parentPath} disabled={currentFolder.key === ''}>
            <ListItemIcon >
                <KeyboardReturnIcon />
            </ListItemIcon>
            <ListItemText primary={`Up one level to ${parentPath}`} />
        </ListItem>);

    return (
        <Container>
            <Typography variant="h6">Current directory: {'/' + currentFolder.key}</Typography>
            <div>
                {
                    (playlist === undefined)
                        ? (error ? `Error loading list: ${error}` : <CircularProgress />)
                        : <List dense={true}>
                            {upOneLevel}
                            {playlist.items.map(renderItem)}
                        </List>
                }
            </div>
        </Container>
    );
};

export default MediaList;
