import S3, { Bucket, ListObjectsV2Request } from 'aws-sdk/clients/s3';
import { AuthService } from './AuthService';
import environment from '../environment';

const authService = new AuthService();


async function getUrl(key: string): Promise<string> {
    const s3Client = await authService.getS3Client();
    const params: any = {
        Bucket: environment.mediaBucket,
        Key: key
    };
    const url = await s3Client.getSignedUrlPromise('getObject', params);
    console.debug(`Got signed url for key ${key}: ${url}`);
    return url;
}

export interface S3Object {
    isFolder: boolean;
    key: string;
    getUrl: () => Promise<string>;
    getParentFolder: () => S3FolderObject;
}

function getParent(path: string): S3FolderObject {
    if (path.endsWith('/')) {
        path = path.substr(0, path.length - 1);
    }
    const parentPath = path.substr(0, path.lastIndexOf('/') + 1);
    return new S3FolderObject(parentPath);
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