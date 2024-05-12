import { ResourcesConfig } from "aws-amplify";
import { CONFIG } from "./frontend-config";

export interface FrontendConfig {
    region: string;
    cognitoIdentityPoolId: string;
    cognitoUserPoolId: string;
    cognitoUserPoolWebClientId: string;
    mediaBucket: string;
    metadataTableName: string;
}

interface EnvironmentConfig {
    region: string;
    mediaBucket: string;
    metadataTableName: string;
    amplifyConfig: ResourcesConfig;
}

const config: FrontendConfig = CONFIG;

const environment: EnvironmentConfig = {
    region: config.region,
    mediaBucket: config.mediaBucket,
    metadataTableName: config.metadataTableName,
    amplifyConfig: {
        Auth: {
            Cognito: {
                userPoolId: config.cognitoUserPoolId,
                userPoolClientId: config.cognitoUserPoolWebClientId,
                identityPoolId: config.cognitoIdentityPoolId,
                allowGuestAccess: false,
            }
        },
    }
};

export default environment;
