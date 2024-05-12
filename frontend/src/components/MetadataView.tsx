import EditIcon from '@mui/icons-material/Edit';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, ListItemText, TextField } from "@mui/material";
import { useState } from 'react';
import { MetadataItem, MetadataService } from "../services/MetadataService";
import { PlaylistItem } from '../services/PlaylistService';

const metadataService = new MetadataService();

export const MetadataView: React.FC<{ metadata?: MetadataItem }> = ({ metadata }) => {
    const view = metadata ? metadata.note : '';
    return (<ListItemText primary={view} />);
}

export const EditMetadataButton: React.FC<{ file: PlaylistItem, metadata?: MetadataItem }> = ({ file, metadata }) => {
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
        <EditMetadataDialog open={dialogOpen} handleClose={handleClose} file={file} metadata={metadata} />
    </>;
}

const EditMetadataDialog: React.FC<{ open: boolean, handleClose: () => void, file: PlaylistItem, metadata?: MetadataItem }> = ({ open, handleClose, file, metadata }) => {
    async function saveMetadata(formData: any) {
        console.log("Save metadata", formData, file);
        if (!metadata) {
            const newMetadata: MetadataItem = {
                key: file.track.key,
                note: formData.note
            };
            await metadataService.insert(newMetadata);
        } else {
            const newMetadata: MetadataItem = {
                key: metadata.key,
                note: formData.note
            };
            await metadataService.insert(newMetadata);
        }
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
