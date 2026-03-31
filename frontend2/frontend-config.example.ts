// Copy this file to frontend-config.ts and fill in the values from the CDK deploy output.
// The shape must match FrontendConfig in ../frontend/src/environment.ts.
export const CONFIG = {
    region: 'eu-central-1',
    cognitoIdentityPoolId: 'eu-central-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    cognitoUserPoolId: 'eu-central-1_XXXXXXXXX',
    cognitoUserPoolWebClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    mediaBucket: 'my-media-bucket',
};
