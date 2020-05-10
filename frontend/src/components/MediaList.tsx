import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import Container from "@material-ui/core/Container";
import CircularProgress from "@material-ui/core/CircularProgress";
import { S3Service, S3Object, S3FolderObject } from "../services/S3Service";
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
    const { currentTrack, playerControl, isPlaying } = useMusicPlayer();
    async function clickHandler() {
        console.debug(`Audio file clicked: ${file.key}`, file);
        playerControl.playTrack(file);
    };

    const isCurrentTrack = currentTrack?.key === file.key;
    const state = isCurrentTrack ? (isPlaying ? 'playing' : 'paused') : '';
    return (<ListItem button onClick={clickHandler}>
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

const MediaList: React.FC<{ path: string }> = ({ path }) => {
    console.debug(`Render MediaList for path '${path}'`);
    const [folderListing, setFolderListing] = useState<S3Object[] | undefined>(undefined);
    const currentFolder = new S3FolderObject(path);
    const classes = useStyles();

    useEffect(() => {
        (async function fetchData() {
            setFolderListing(undefined);
            console.debug(`Fetching list for ${currentFolder.key}`);
            try {
                const media = await s3.listMedia(currentFolder.key);
                console.debug(`Got list for '${currentFolder.key}': ${media.length} items`, media);
                setFolderListing(media);
            } catch (error) {
                console.error("Error listing media bucket", error);
                setFolderListing([]);
            }
        })();
    }, [path]);

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
    console.debug(`Parent path: ${parentPath}`);
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
