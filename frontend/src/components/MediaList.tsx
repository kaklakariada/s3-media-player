import React, { useEffect, useState } from "react";
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
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
import { CardMedia } from '@material-ui/core';
import useMusicPlayer from "../hooks/useMusicPlayer";


const s3 = new S3Service();

const FolderListItem: React.FC<{ folder: S3Object, openFolderCallback: (object: S3Object) => void }> = ({ folder, openFolderCallback }) => {
    const clickHandler = () => openFolderCallback(folder);
    return (<ListItem button onClick={clickHandler}>
        <ListItemIcon>
            <FolderIcon />
        </ListItemIcon>
        <ListItemText primary={folder.key} />
    </ListItem>);
}

const OtherFileItem: React.FC<{ file: S3Object }> = ({ file }) => {
    return (<ListItem>
        <ListItemIcon>
            <InsertDriveFileIcon />
        </ListItemIcon>
        <ListItemText primary={file.key} />
    </ListItem>);
}

const AudioFileItem: React.FC<{ file: S3Object }> = ({ file }) => {
    const { currentTrack, playerControl, isPlaying } = useMusicPlayer();
    async function clickHandler() {
        playerControl.playTrack(file);
    };

    const isCurrentTrack = currentTrack?.key === file.key;
    const state = isCurrentTrack ? (isPlaying ? 'playing' : 'paused') : '';
    return (<ListItem button onClick={clickHandler}>
        <ListItemIcon>
            <AudiotrackIcon />
        </ListItemIcon>
        <ListItemText primary={file.key} secondary={state} />
    </ListItem>);
}

const MediaList: React.FC = () => {
    const [keys, setMediaList] = useState<S3Object[] | undefined>(undefined);
    const [currentFolder, setCurrentFolder] = useState<S3Object>(new S3FolderObject(''));

    async function fetchData() {
        try {
            const media = await s3.listMedia(currentFolder.key);
            setMediaList(media);
        } catch (error) {
            console.error("Error listing media bucket", error);
        }
    }
    useEffect(() => { fetchData(); }, [currentFolder]);

    function openFolderCallback(object: S3Object) {
        console.log("Open folder ", object);
        setCurrentFolder(object);
    }

    function upOneLevelCallback() {
        openFolderCallback(currentFolder.getParentFolder());
    }

    const isAudioFile = (object: S3Object) => object.key.toLowerCase().endsWith('.mp3');

    function renderItem(object: S3Object) {
        if (object.isFolder) {
            return <FolderListItem key={object.key} folder={object} openFolderCallback={openFolderCallback} />;
        }
        if (isAudioFile(object)) {
            return <AudioFileItem key={object.key} file={object} />
        }
        return <OtherFileItem key={object.key} file={object} />
    }


    const upOneLevel: JSX.Element = (<ListItem button onClick={upOneLevelCallback} disabled={currentFolder.key === ''}>
        <ListItemIcon>
            <KeyboardReturnIcon />
        </ListItemIcon>
        <ListItemText primary="Up one level" />
    </ListItem>);

    return (
        <Container>
            <div>
                {
                    (keys === undefined)
                        ? <CircularProgress />
                        : <List dense={true}>
                            {upOneLevel}
                            {keys.map(renderItem)}
                        </List>
                }
            </div>
        </Container>
    );
};

export default MediaList;
