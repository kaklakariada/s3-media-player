#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack, InfrastructureStackProps } from '../lib/infrastructure-stack';
import { CONFIG } from "../infrastructure-config";
import { InfrastructureConfig } from "../lib/infrastructure-config-interface";

const config: InfrastructureConfig = CONFIG;

const props: InfrastructureStackProps = {
    env: { region: config.region },
    description: `S3 Media Player ${config.domain}`,
    tags: { stack: config.stackName },
    domain: config.domain,
    hostedZoneName: config.hostedZoneName,
    sslCertificateArn: config.sslCertificateArn,
    contactEmailAddress: config.contactEmailAddress,
    mediaBucket: config.mediaBucket
};

const app = new cdk.App();
new InfrastructureStack(app, config.stackName, props);
