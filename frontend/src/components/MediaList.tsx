import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { ListItemButton, Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useMusicPlayer from "../hooks/useMusicPlayer";
import { MediaService, S3Object } from "../services/MediaService";
import { FolderMetadata, MetadataItem, MetadataService } from '../services/MetadataService';
import { Playlist, PlaylistItem, PlaylistService } from "../services/PlaylistService";
import { AudioFileItem, FolderListItem, OtherFileItem } from './ListItem';

const s3 = new MediaService();
const metadataService = new MetadataService();
const playlistService = new PlaylistService();


type GenericError = any;

const MediaList: React.FC<{ bucket: string, path: string, time?: number }> = ({ bucket, path, time }) => {
    const [playlist, setPlaylist] = useState<Playlist | undefined>(undefined);
    const [folderMetadata, setFolderMetadata] = useState<FolderMetadata | undefined>(undefined);
    const [error, setError] = useState<GenericError | undefined>(undefined);
    const [metadataError, setMetadataError] = useState<GenericError | undefined>(undefined);
    const { playerControl } = useMusicPlayer();

    const isFolder = path === '' || path.indexOf('/') < 0 || path.endsWith('/');
    const folderPath = isFolder ? path : path.substring(0, path.lastIndexOf('/') + 1);
    const currentFolder = s3.getFolder(bucket, folderPath);

    useEffect(() => {
        (async function fetchData() {
            setPlaylist(undefined);
            try {
                const media = await s3.listMedia(bucket, currentFolder.key);
                setPlaylist(playlistService.createPlaylist(media));
                setError(undefined);
            } catch (e) {
                console.error("Error listing media bucket", e);
                setPlaylist(undefined);
                setError(e);
            }
        })();
    }, [bucket, currentFolder.key]);

    useEffect(() => {
        (async function fetchMetadata() {
            if (folderMetadata?.path === folderPath) {
                console.log("Metadata already loaded for ", folderPath);
                return;
            }
            await updateMetadata();
        })();
    }, [folderMetadata, folderPath]);

    async function updateMetadata() {
        console.log("Getting metadata for ", folderPath);
        try {
            const metadata = await metadataService.getMetadata(folderPath);
            console.log("Metadata", metadata);
            setFolderMetadata(metadata);
        } catch (e) {
            console.error("Error getting metadata", e);
            setMetadataError(e)
        }
    }

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


    function getMetadata(key: string): MetadataItem | undefined {
        if (!folderMetadata) {
            return undefined;
        }
        return folderMetadata.items.find(item => item.key === key);
    }



    function renderItem(object: PlaylistItem) {
        if (object.track.isFolder) {
            return <FolderListItem key={object.track.key} folder={object.track} />;
        }
        const metadata = getMetadata(object.track.key);
        if (isAudioFile(object.track)) {
            return <AudioFileItem key={object.track.key} file={object} metadata={metadata} metadataChangeCallback={updateMetadata} />
        }
        return <OtherFileItem key={object.track.key} file={object} metadata={metadata} />
    }

    const parentPath = `/${currentFolder.getParentFolder().key}`;
    const upOneLevel: JSX.Element = (
        <ListItemButton component={Link} to={parentPath} disabled={currentFolder.key === ''}>
            <ListItemIcon >
                <KeyboardReturnIcon />
            </ListItemIcon>
            <ListItemText primary={`Up one level to ${parentPath}`} />
        </ListItemButton>);

    const loadingState = error ? `Error loading list: ${error}` : <CircularProgress />;

    function getMetadataInfo() {
        if (metadataError) {
            return `Error loading metadata: ${metadataError}`;

        }
        if (folderMetadata) {
            return `Metadata loaded for ${folderMetadata.items.length} items`;
        }
        return "Loading metadata..."
    }

    return (
        <Container>
            <Typography variant="h6">Current directory: {'/' + currentFolder.key}. {getMetadataInfo()}</Typography>
            <div>
                {
                    (playlist === undefined)
                        ? loadingState
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
