import { S3 } from 'aws-sdk';
import { AuthService } from './AuthService';
import { S3Client, SignedUrl } from './AuthenticatedS3Client';

const s3Client = new S3Client(new AuthService());

async function getUrl(bucket: string, key: string): Promise<SignedUrl> {
    return await s3Client.getSignedUrl('getObject', bucket, key);
}

export interface S3Folder {
    isFolder: boolean;
    isFile: boolean;
    key: string;
    bucket: string;
    fileName: string;
    getParentFolder: () => S3Folder;
}

export interface S3Object extends S3Folder {
    getUrl: () => Promise<SignedUrl>;
}

function getParent(object: S3Folder): S3Folder {
    let path = object.key;
    if (path.endsWith('/')) {
        path = path.substring(0, path.length - 1);
    }
    const parentPath = path.substring(0, path.lastIndexOf('/') + 1);
    return new S3FolderObject(object.bucket, parentPath);
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
    bucket: string;
    key: string;

    constructor(bucket: string, key: string) {
        this.bucket = bucket;
        this.key = key;
    }

    async getUrl() : Promise<SignedUrl>{
        if (this.isFolder) {
            throw new Error(`Cannot get url for folder ${this.key}`);
        }
        return await getUrl(this.bucket, this.key);
    }

    getParentFolder(): S3Folder {
        return getParent(this);
    }

    get isFolder() {
        return this.key.endsWith('/');
    }

    get isFile() {
        return !this.isFolder;
    }

    get fileName() {
        return getFileName(this.key);
    }
}

class S3FolderObject implements S3Object {
    bucket: string;
    key: string;

    constructor(bucket: string, prefix: string) {
        this.bucket = bucket;
        this.key = prefix;
    }

    async getUrl(): Promise<SignedUrl> {
        throw new Error(`Cannot get url for folder ${this.key}`);
    }

    getParentFolder() {
        return getParent(this);
    }

    get isFolder() {
        return true;
    }

    get isFile() {
        return false;
    }

    get fileName() {
        return getFileName(this.key);
    }
}

export class MediaService {
    async listMedia(bucket: string, prefix: string): Promise<S3Object[]> {
        const response = await s3Client.listObjects(bucket, prefix);
        const folders: S3Object[] = response.CommonPrefixes?.map(prefix => this.convertCommonPrefix(bucket, prefix)) || [];
        const objects: S3Object[] = response.Contents?.map(object => this.convertObject(bucket, object)) || [];
        return folders.concat(objects).filter(o => o.key !== prefix);
    }

    getFolder(bucket: string, prefix: string): S3Folder {
        return new S3FolderObject(bucket, prefix);
    }

    convertObject(bucket: string, object: S3.Object): S3Object {
        const file = new S3FileObject(bucket, object.Key ?? '(no key)');
        if (file.key.endsWith('/')) {
            return new S3FolderObject(bucket, file.key);
        }
        return file;
    }

    convertCommonPrefix(bucket: string, prefix: S3.CommonPrefix): S3Object {
        return new S3FolderObject(bucket, prefix.Prefix ?? '(unknown prefix)');
    }
}
