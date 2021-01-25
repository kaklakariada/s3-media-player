import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
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

const s3 = new S3Service();

const FolderListItem: React.FC<{ folder: S3Object }> = ({ folder }) => {
    return (<ListItem button component={Link} to={`/${folder.key}`}>
        <ListItemIcon>
            <FolderIcon />
        </ListItemIcon>
        <ListItemText primary={folder.fileName} />
    </ListItem>);
}

const OtherFileItem: React.FC<{ file: S3Object }> = ({ file }) => {
    return (<ListItem>
        <ListItemIcon>
            <InsertDriveFileIcon />
        </ListItemIcon>
        <ListItemText primary={file.fileName} />
    </ListItem>);
}

const AudioFileItem: React.FC<{ file: S3Object }> = ({ file }) => {
    const { currentTrack, isPlaying } = useMusicPlayer();
    const isCurrentTrack = currentTrack?.key === file.key;
    const state = isCurrentTrack ? (isPlaying ? 'playing' : 'paused') : '';
    return (<ListItem button component={Link} to={`/${file.key}`}>
        <ListItemIcon>
            <AudiotrackIcon />
        </ListItemIcon>
        <ListItemText primary={file.fileName} secondary={state} />
    </ListItem>);
}

const useStyles = makeStyles(theme => ({
    root: {
        'text-align': 'left',
        'font-family': '"Roboto", "Helvetica", "Arial", sans-serif',
        'font-weight': 400,
        'line-height': 1.43
    },
}));

const MediaList: React.FC<{ path: string, time?: number }> = ({ path, time }) => {
    const [folderListing, setFolderListing] = useState<S3Object[] | undefined>(undefined);
    const { playerControl, currentTrack } = useMusicPlayer();

    const isFolder = path === '' || path.indexOf('/') < 0 || path.endsWith('/');
    const folderPath = isFolder ? path : path.substr(0, path.lastIndexOf('/') + 1);
    const currentFolder = s3.getFolder(folderPath);
    const startPlaying = !isFolder && (!currentTrack || currentTrack.key !== path);

    const classes = useStyles();

    useEffect(() => {
        (async function fetchData() {
            setFolderListing(undefined);
            try {
                const media = await s3.listMedia(currentFolder.key);
                setFolderListing(media);
            } catch (error) {
                console.error("Error listing media bucket", error);
                setFolderListing([]);
            }
        })();
    }, [currentFolder.key]);

    useEffect(() => {
        (async function fetchData() {
            if (startPlaying) {
                const file = await s3.getObject(path);
                playerControl.playTrack(file);
                if (time) {
                    playerControl.seekToTime(time);
                }
            }
        })();
    }, [startPlaying, path, time, playerControl]);

    const isAudioFile = (object: S3Object) => object.key.toLowerCase().endsWith('.mp3');

    function renderItem(object: S3Object) {
        if (object.isFolder) {
            return <FolderListItem key={object.key} folder={object} />;
        }
        if (isAudioFile(object)) {
            return <AudioFileItem key={object.key} file={object} />
        }
        return <OtherFileItem key={object.key} file={object} />
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
        <Container className={classes.root}>
            <div>Current directory: {'/' + currentFolder.key}</div>
            <div>
                {
                    (folderListing === undefined)
                        ? <CircularProgress />
                        : <List dense={true}>
                            {upOneLevel}
                            {folderListing.map(renderItem)}
                        </List>
                }
            </div>
        </Container>
    );
};

export default MediaList;
