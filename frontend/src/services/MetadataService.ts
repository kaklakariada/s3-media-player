import { AuthDynamoDbClient } from "./AuthenticatedDynamoDbClient";
import { AUTH_SERVICE } from "./AuthService";


const dynamoDbClient = new AuthDynamoDbClient(AUTH_SERVICE)

export interface FolderMetadata {
    path: string;
    items: MetadataItem[];
}

export interface MetadataItem {
    key: string;
    note: string;
}

export class MetadataService {
    async getMetadata(prefix: string): Promise<FolderMetadata> {
        const items = await dynamoDbClient.query(prefix);
        return { path: prefix, items: items.map(convertItem) };
    }
}

function convertItem(item: Record<string, any>): MetadataItem {
    return {
        key: item['path'].S,
        note: item['note'].S
    };
}

