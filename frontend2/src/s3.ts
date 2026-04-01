import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AuthService } from './auth';
import config from './config';

export interface S3Item {
    key: string;
    name: string;
    isFolder: boolean;
}

/**
 * Thin S3 wrapper that authenticates each request with fresh Cognito Identity
 * Pool credentials. A single S3Client is created with a dynamic credential
 * provider so the SDK transparently refreshes credentials as they expire.
 */
export class S3Browser {
    private readonly client: S3Client;

    constructor(auth: AuthService) {
        this.client = new S3Client({
            region: config.region,
            // Arrow function so the SDK can call it on every request,
            // picking up fresh Cognito credentials after token rotation.
            credentials: () => auth.getCredentials(),
        });
    }

    /** Lists the immediate children of `prefix` (folders and files). */
    async list(prefix: string): Promise<S3Item[]> {
        const response = await this.client.send(
            new ListObjectsV2Command({
                Bucket: config.mediaBucket,
                Prefix: prefix,
                Delimiter: '/',
            }),
        );

        const folders: S3Item[] = (response.CommonPrefixes ?? []).map((p) => ({
            key: p.Prefix!,
            name: basename(p.Prefix!),
            isFolder: true,
        }));

        const files: S3Item[] = (response.Contents ?? [])
            .filter((o) => o.Key !== prefix) // exclude the "directory itself" entry
            .map((o) => ({
                key: o.Key!,
                name: basename(o.Key!),
                isFolder: false,
            }));

        return [...folders, ...files];
    }

    /**
     * Creates a presigned GET URL for `key` that is valid for `expiresIn`
     * seconds (default 1 hour).
     */
    async presignUrl(key: string, expiresIn = 3600): Promise<string> {
        return getSignedUrl(
            this.client,
            new GetObjectCommand({ Bucket: config.mediaBucket, Key: key }),
            { expiresIn },
        );
    }
}

export function basename(path: string): string {
    const p = path.endsWith('/') ? path.slice(0, -1) : path;
    return p.slice(p.lastIndexOf('/') + 1);
}
