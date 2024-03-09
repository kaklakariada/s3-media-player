import { CONFIG } from "./frontend-config";
import { ResourcesConfig } from "aws-amplify";

export interface FrontendConfig {
    region: string;
    cognitoIdentityPoolId: string;
    cognitoUserPoolId: string;
    cognitoUserPoolWebClientId: string;
    mediaBucket: string;
}

interface EnvironmentConfig {
    region: string;
    mediaBucket: string;
    amplifyConfig: ResourcesConfig;
}

const config: FrontendConfig = CONFIG;

const environment: EnvironmentConfig = {
    region: config.region,
    mediaBucket: config.mediaBucket,
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
