import { Auth } from "aws-amplify";
import S3 from 'aws-sdk/clients/s3';
import { CognitoUserSession } from "amazon-cognito-identity-js";
import environment from '../environment';

interface EssentialCredentials {
    accessKeyId: any;
    sessionToken: any;
    secretAccessKey: any;
    identityId: any;
    authenticated: any;
}

interface AuthData {
    id: string;
    name?: string;
    username: string;
    signInUserSession: CognitoUserSession;
}

export class AuthService {

    currentAuthenticatedUser(): Promise<AuthData> {
        return Auth.currentAuthenticatedUser();
    }

    getCredentials(): Promise<EssentialCredentials> {
        return Auth.currentUserCredentials()
            .then((cred) => {
                const essentialCredentials = Auth.essentialCredentials(cred);
                console.debug("Got credentials", cred, essentialCredentials);
                return essentialCredentials;
            })
            .catch((err: any) => {
                console.error("Error getting credentials", err);
                throw new Error(err);
            });
    }

    async getIdToken(): Promise<string> {
        const cred = await this.currentAuthenticatedUser();
        return cred.signInUserSession.getIdToken().getJwtToken();
    }

    s3Client: S3 | undefined = undefined;

    async getS3Client(): Promise<S3> {
        if (!this.s3Client) {
            const credentials = await this.getCredentials();
            const s3Config: S3.Types.ClientConfiguration = {
                region: environment.region,
                credentials: credentials
            };
            this.s3Client = new S3(s3Config);
        }
        return this.s3Client;
    }

    signOut() {

        Auth.signOut();
    }
}
