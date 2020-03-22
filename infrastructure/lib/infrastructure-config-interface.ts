export interface InfrastructureConfig {
    region: string;
    domain: string;
    hostedZoneName: string;
    sslCertificateArn: string;
    stackName: string;
    contactEmailAddress: string;
    mediaBucket: string;
}
