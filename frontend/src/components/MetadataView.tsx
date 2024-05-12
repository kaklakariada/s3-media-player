import { ListItemText } from "@mui/material";
import { MetadataItem } from "../services/MetadataService";


export const MetadataView: React.FC<{ metadata?: MetadataItem }> = ({ metadata }) => {
    if (!metadata) {
        return <></>;
    }
    return (<ListItemText secondary={metadata.note} />);
}
