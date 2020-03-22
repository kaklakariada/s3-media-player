import { Bucket } from 'aws-sdk/clients/s3';
import { AuthService } from './AuthService';

const authService = new AuthService();

export class S3Service {
    async listBuckets(): Promise<string[]> {
        const s3Client = await authService.getS3Client();
        const response = await s3Client.listBuckets().promise();
        const buckets: Bucket[] = response.Buckets || [];
        return buckets.map(b => b.Name || "(unknown bucket)");
    }
}