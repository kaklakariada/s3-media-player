import { CONFIG } from "./frontend-config";

export interface FrontendConfig {
    region: string;
    cognitoIdentityPoolId: string;
    cognitoUserPoolId: string;
    cognitoUserPoolWebClientId: string;
    mediaBucket: string;
}

interface AmplifyConfig {
    Auth: {
        identityPoolId: string;
        identityPoolRegion: string;
        region: string;
        userPoolId: string;
        userPoolWebClientId: string;
        mandatorySignIn: boolean;
        authenticationFlowType: string;
    };
}

interface EnvironmentConfig {
    region: string;
    mediaBucket: string;
    amplifyConfig: AmplifyConfig;
}

const config: FrontendConfig = CONFIG;

const environment: EnvironmentConfig = {
    region: config.region,
    mediaBucket: config.mediaBucket,
    amplifyConfig: {
        Auth: {
            identityPoolId: config.cognitoIdentityPoolId,
            identityPoolRegion: config.region,
            region: config.region,
            userPoolId: config.cognitoUserPoolId,
            userPoolWebClientId: config.cognitoUserPoolWebClientId,
            mandatorySignIn: true,
            authenticationFlowType: "USER_SRP_AUTH"
        },
    }
};

export default environment;
