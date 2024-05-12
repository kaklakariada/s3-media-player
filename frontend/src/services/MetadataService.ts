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
    async insert(value: MetadataItem) {
        await dynamoDbClient.insert(value);
    }
    async getMetadata(prefix: string): Promise<FolderMetadata> {
        const items = await dynamoDbClient.query(prefix);
        console.log("Raw metadata", items);
        return { path: prefix, items: items.map(convertItem) };
    }
}

function convertItem(item: Record<string, any>): MetadataItem {
    return item as MetadataItem;
}

