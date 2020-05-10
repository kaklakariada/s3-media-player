import S3, { Bucket, ListObjectsV2Request } from 'aws-sdk/clients/s3';
import { AuthService } from './AuthService';
import environment from '../environment';

const authService = new AuthService();

async function getUrl(key: string): Promise<string> {
    const s3Client = await authService.getS3Client();
    const validForSeconds = 5 * 60 * 60;
    const params: any = {
        Bucket: environment.mediaBucket,
        Key: key,
        Expires: validForSeconds
    };
    return await s3Client.getSignedUrlPromise('getObject', params);
}

export interface S3Folder {
    isFolder: boolean;
    key: string;
    fileName: string;
    getParentFolder: () => S3Folder;
}

export interface S3Object extends S3Folder {
    getUrl: () => Promise<string>;
}

function getParent(path: string): S3Folder {
    if (path.endsWith('/')) {
        path = path.substr(0, path.length - 1);
    }
    const parentPath = path.substr(0, path.lastIndexOf('/') + 1);
    return new S3FolderObject(parentPath);
}

function getFileName(path: string): string {
    if (path.endsWith('/')) {
        path = path.substring(0, path.length - 1);
    }
    const indexOfLastSlash = path.lastIndexOf('/');
    if (indexOfLastSlash >= 0) {
        path = path.substring(indexOfLastSlash + 1, path.length);
    }
    return path;
}

class S3FileObject implements S3Object {
    object: S3.Object;

    constructor(object: S3.Object) {
        this.object = object;
    }

    async getUrl() {
        if (this.isFolder) {
            throw new Error(`Cannot get url for folder ${this.key}`);
        }
        return getUrl(this.key);
    }

    getParentFolder() {
        return getParent(this.key);
    }

    get key() {
        return this.object.Key || '(no key)';
    }

    get isFolder() {
        return this.key.endsWith('/');
    }

    get fileName() {
        return getFileName(this.key);
    }
}

export class S3FolderObject implements S3Object {
    key: string;

    constructor(prefix: string) {
        this.key = prefix;
    }

    async getUrl(): Promise<string> {
        throw new Error(`Cannot get url for folder ${this.key}`);
    }

    getParentFolder() {
        return getParent(this.key);
    }

    get isFolder() {
        return true;
    }

    get fileName() {
        return getFileName(this.key);
    }
}

export class S3Service {
    async listBuckets(): Promise<string[]> {
        const s3Client = await authService.getS3Client();
        const response = await s3Client.listBuckets().promise();
        const buckets: Bucket[] = response.Buckets || [];
        return buckets.map(b => b.Name || "(unknown bucket)");
    }

    async listMedia(prefix: string): Promise<S3Object[]> {
        const s3Client = await authService.getS3Client();
        const params: ListObjectsV2Request = {
            Bucket: environment.mediaBucket,
            Delimiter: '/',
            Prefix: prefix
        };
        const response = await s3Client.listObjectsV2(params).promise();
        const folders: S3Object[] = response.CommonPrefixes?.map(this.convertCommonPrefix) || [];
        const objects: S3Object[] = response.Contents?.map(this.convertObject) || [];
        return folders.concat(objects).filter(o => o.key !== prefix);
    }

    async getObject(key: string): Promise<S3Object> {
        return new S3FileObject(environment.mediaBucket, key);
    }
    
    getFolder(prefix: string): S3Folder {
        return new S3FolderObject(environment.mediaBucket, prefix);
    }

    convertObject(object: S3.Object): S3Object {
        const file = new S3FileObject(object);
        if (file.key.endsWith('/')) {
            return new S3FolderObject(file.key);
        }
        return file;
    }

    convertCommonPrefix(prefix: S3.CommonPrefix): S3Object {
        return new S3FolderObject(prefix.Prefix || '(unknown prefix)');
    }
}