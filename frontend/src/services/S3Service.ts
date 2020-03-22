import S3, { Bucket, ListObjectsV2Request } from 'aws-sdk/clients/s3';
import { AuthService } from './AuthService';
import environment from '../environment';

const authService = new AuthService();

export interface S3Object {
    key: string;
    isFolder: boolean;
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
        return folders.concat(objects);
    }

    convertObject(object: S3.Object): S3Object {
        return {
            key: object.Key || "Unknown",
            isFolder: false
        };
    }
    
    convertCommonPrefix(prefix: S3.CommonPrefix): S3Object {
        return {
            key: prefix.Prefix || "Unknown",
            isFolder: true
        };
    }
}