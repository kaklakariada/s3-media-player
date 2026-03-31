import { CONFIG } from './frontend-config';

export interface AppConfig {
    region: string;
    identityPoolId: string;
    userPoolId: string;
    userPoolClientId: string;
    mediaBucket: string;
}

const config: AppConfig = {
    region: CONFIG.region,
    identityPoolId: CONFIG.cognitoIdentityPoolId,
    userPoolId: CONFIG.cognitoUserPoolId,
    userPoolClientId: CONFIG.cognitoUserPoolWebClientId,
    mediaBucket: CONFIG.mediaBucket,
};

export default config;
