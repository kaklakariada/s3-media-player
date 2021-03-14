import S3, { ListObjectsV2Request } from "aws-sdk/clients/s3";
import { AuthService } from "./AuthService";
import environment from '../environment';
import { ICredentials } from '@aws-amplify/core';

interface State {
    s3: S3;
    credentials: ICredentials;
}

export class S3Client {
    private state: State | undefined;
    private authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    async getSignedUrl(operation: string, bucket: string, key: string, validForSeconds: number): Promise<string> {
        const params: any = {
            Bucket: bucket,
            Key: key,
            Expires: validForSeconds
        };
        return (await this.getS3()).getSignedUrlPromise(operation, params);
    }

    async listBuckets() {
        return (await this.getS3()).listBuckets().promise();
    }

    async listObjectsV2(params: ListObjectsV2Request) {
        return (await this.getS3()).listObjectsV2(params).promise();
    }

    private async createClient(): Promise<State> {
        const credentials = await this.getCredentials();
        const s3Config: S3.Types.ClientConfiguration = {
            region: environment.region,
            credentials: credentials
        };
        return { s3: new S3(s3Config), credentials };
    }

    private async getCredentials() {
        try {
            return await this.authService.getCredentials();
        } catch(error) {
            throw Error("Error getting credentials: " + error);
        }
    }

    private async getS3(): Promise<S3> {
        if (!this.state || !this.state.credentials.authenticated) {
            this.state = await this.createClient();
        }
        return this.state.s3;
    }
}