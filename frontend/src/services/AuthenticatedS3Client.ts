import S3, { ListObjectsV2Request } from "aws-sdk/clients/s3";
import environment from '../environment';
import { AuthService, RenewableCredentials } from "./AuthService";

interface State {
    s3: S3;
    credentials: RenewableCredentials;
}

export class SignedUrl {
    constructor(public url: string, private operation: string, private bucket: string, public key: string,
        private expiration: Date, private s3Client: S3Client) { }

    get remainingValidTimeMillis(): number {
        return this.expiration.getTime() - Date.now();
    }

    whenExpired(consumer: (url: SignedUrl) => void) {
        const expirationMillis = this.expiration.getTime() - Date.now();
        console.log(`Renewing signed url in ${expirationMillis / 1000 / 60} minutes`);
        setTimeout(async () => {
            const newUrl = await this.s3Client.getSignedUrl(this.operation, this.bucket, this.key);
            consumer(newUrl);
        }, expirationMillis);
    }
}

export class S3Client {
    private state: State | undefined;

    constructor(private authService: AuthService) {
        this.state = undefined
     }

    async getSignedUrl(operation: string, bucket: string, key: string): Promise<SignedUrl> {
        const state = await this.getState();
        const validForSeconds = state.credentials.remainingValidTimeMillis / 1000
        //const validForSeconds = 10
        const expiration = new Date(Date.now() + validForSeconds * 1000);
        const params: any = {
            Bucket: bucket,
            Key: key,
            Expires: validForSeconds
        };
        console.log(`Getting signed url for ${operation} ${bucket}/${key} valid for ${validForSeconds} seconds`);
        const url = await state.s3.getSignedUrlPromise(operation, params);
        return new SignedUrl(url, operation, bucket, key, expiration, this);
    }

    async listObjects(bucket: string, prefix: string) {
        const params: ListObjectsV2Request = {
            Bucket: bucket,
            Delimiter: '/',
            Prefix: prefix
        };
        return (await this.getS3()).listObjectsV2(params).promise();
    }

    private async createState(credentials: RenewableCredentials): Promise<State> {
        const s3Config: S3.Types.ClientConfiguration = {
            region: environment.region,
            credentials: credentials.credentials
        };
        return { s3: new S3(s3Config), credentials };
    }

    private async getState(): Promise<State> {
        if (!this.state) {
            const credentials = await this.authService.getRenewableCredentials();
            this.state = await this.createState(credentials);
            credentials.whenExpired(async (newCredentials) => {
                console.log("Creating new S3 client with new credentials");
                this.state = await this.createState(newCredentials)
            })
        }
        return this.state;
    }

    private async getS3(): Promise<S3> {
        return (await this.getState()).s3;
    }
}
