import React, { useEffect, useState } from "react";
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Container from "@material-ui/core/Container";
import CircularProgress from "@material-ui/core/CircularProgress";
import { S3Service, S3Object } from "../services/S3Service";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import FolderIcon from '@material-ui/icons/Folder';
import AudiotrackIcon from '@material-ui/icons/Audiotrack';
import ListSubheader from '@material-ui/core/ListSubheader';

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

const FileItem: React.FC<{ file: S3Object }> = ({ file }) => {
    const clickHandler = () => {
        console.log("Play file ", file);
    };
    return (<ListItem button onClick={clickHandler}>
        <ListItemIcon>
            <AudiotrackIcon />
        </ListItemIcon>
        <ListItemText primary={file.key} />
    </ListItem>);
}

const MediaList: React.FC = () => {
    const [keys, setMediaList] = useState<S3Object[] | undefined>(undefined);
    const [currentFolder, setCurrentFolder] = useState<S3Object>({ key: '', isFolder: true });

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

    function renderItem(object: S3Object) {
        if (object.isFolder) {
            return <FolderListItem key={object.key} folder={object} openFolderCallback={openFolderCallback} />;
        }
        return <FileItem key={object.key} file={object} />
    }
    return (
        <Container>
            <div>
                {
                    (keys === undefined)
                        ? <CircularProgress />
                        : <List dense={true}>
                            {keys.map(renderItem)}
                        </List>
                }
            </div>
        </Container>
    );
};

export default MediaList;
