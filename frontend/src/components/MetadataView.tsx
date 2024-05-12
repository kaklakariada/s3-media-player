import EditIcon from '@mui/icons-material/Edit';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, ListItemText, TextField } from "@mui/material";
import { useState } from 'react';
import { MetadataItem, MetadataService } from "../services/MetadataService";
import { PlaylistItem } from '../services/PlaylistService';

const metadataService = new MetadataService();

export type MetadataChangeCallback = (metadata: MetadataItem) => void;

export const MetadataView: React.FC<{ metadata?: MetadataItem }> = ({ metadata }) => {
    const view = metadata ? metadata.note : '';
    return (<ListItemText primary={view} />);
}

export const EditMetadataButton: React.FC<{ file: PlaylistItem, metadata?: MetadataItem, changeCallback: MetadataChangeCallback }> = ({ file, metadata, changeCallback }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    function editMetadata() {
        setDialogOpen(true);
    }
    function handleClose() {
        setDialogOpen(false);
    }
    return <>
        <IconButton edge="start" aria-label="metadata" onClick={editMetadata}>
            <EditIcon />
        </IconButton>
        <EditMetadataDialog open={dialogOpen} handleClose={handleClose} file={file} metadata={metadata} changeCallback={changeCallback} />
    </>;
}

const EditMetadataDialog: React.FC<{ open: boolean, handleClose: () => void, file: PlaylistItem, metadata?: MetadataItem, changeCallback: MetadataChangeCallback }> = ({ open, handleClose, file, metadata, changeCallback }) => {
    async function saveMetadata(formData: any) {
        console.log("Save metadata", formData, file);
        const newMetadata: MetadataItem = {
                key: file.track.key,
                note: formData.note
        };
        await metadataService.insert(newMetadata);
        changeCallback(newMetadata);
    }
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{
                component: 'form',
                onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const formJson = Object.fromEntries((formData as any).entries()) as any;
                    saveMetadata(formJson);
                    handleClose();
                },
            }}
        >
            <DialogTitle>Edit Metadata</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Edit metadata for {file.track.fileName}
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="note"
                    name="note"
                    label="Note"
                    type="text"
                    fullWidth
                    variant="standard"
                    defaultValue={metadata?.note}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit">Save</Button>
            </DialogActions>
        </Dialog>
    );
}
