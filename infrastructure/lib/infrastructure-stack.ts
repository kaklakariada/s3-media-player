import * as cdk from '@aws-cdk/core';
import { StaticContentConstruct } from './static-content';
import { CognitoAuthConstruct } from './auth';

export interface InfrastructureStackProps extends cdk.StackProps {
  domain: string;
  hostedZoneName: string;
  sslCertificateArn: string;
  contactEmailAddress: string;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    new StaticContentConstruct(this, 'StaticContent', {
      domain: props.domain,
      hostedZoneName: props.hostedZoneName,
      sslCertificateArn: props.sslCertificateArn
    });

    new CognitoAuthConstruct(this, 'Auth', {
      contactEmailAddress: props.contactEmailAddress,
      domain: props.domain
    })
  }
}
