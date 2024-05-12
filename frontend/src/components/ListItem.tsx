import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { ListItemButton } from "@mui/material";
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import React from "react";
import { Link } from "react-router-dom";
import useMusicPlayer from "../hooks/useMusicPlayer";
import { S3Object } from "../services/MediaService";
import { MetadataItem } from '../services/MetadataService';
import { PlaylistItem } from "../services/PlaylistService";
import { EditMetadataButton, MetadataView } from './MetadataView';

export const FolderListItem: React.FC<{ folder: S3Object }> = ({ folder }) => {
    return (<ListItemButton component={Link} to={`/${folder.key}`}>
        <ListItemIcon>
            <FolderIcon />
        </ListItemIcon>
        <ListItemText primary={folder.fileName} />
    </ListItemButton>);
}

export const OtherFileItem: React.FC<{ file: PlaylistItem, metadata?: MetadataItem }> = ({ file, metadata }) => {
    return (<ListItem>
        <ListItemIcon>
            <InsertDriveFileIcon />
        </ListItemIcon>
        <ListItemText primary={file.track.fileName} />
        <MetadataView metadata={metadata} />
    </ListItem>);
}

export const AudioFileItem: React.FC<{ file: PlaylistItem, metadata?: MetadataItem }> = ({ file, metadata }) => {
    const { currentTrack, isPlaying } = useMusicPlayer();
    const isCurrentTrack = file.equals(currentTrack);
    const playingState = isPlaying ? 'playing' : 'paused';
    const state = isCurrentTrack ? playingState : '';
    return (
        <ListItem key={file.track.fileName} disablePadding={false} secondaryAction={
            <EditMetadataButton file={file} metadata={metadata} />}>
            <ListItemButton component={Link} to={`/${file.track.key}`}>
                <ListItemIcon>
                    <AudiotrackIcon />
                </ListItemIcon>
                <ListItemText primary={file.track.fileName} secondary={state} />
                <MetadataView metadata={metadata} />
            </ListItemButton>
        </ListItem>
    );
}
