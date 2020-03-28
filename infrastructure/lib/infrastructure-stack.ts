import * as cdk from '@aws-cdk/core';
import { StaticContentConstruct } from './static-content';
import { CognitoAuthConstruct } from './auth';
import { PolicyStatement, Role } from "@aws-cdk/aws-iam";
import { Bucket } from "@aws-cdk/aws-s3";

export interface InfrastructureStackProps extends cdk.StackProps {
  domain: string;
  hostedZoneName: string;
  sslCertificateArn: string;
  contactEmailAddress: string;
  mediaBucket: string;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    new StaticContentConstruct(this, 'StaticContent', {
      domain: props.domain,
      hostedZoneName: props.hostedZoneName,
      sslCertificateArn: props.sslCertificateArn
    });

    const auth = new CognitoAuthConstruct(this, 'Auth', {
      contactEmailAddress: props.contactEmailAddress,
      domain: props.domain
    });

    const mediaBucket = Bucket.fromBucketName(this, 'MediaBucket', props.mediaBucket);
    auth.getUserRole().addToPolicy(new PolicyStatement({
      actions: ["s3:ListBucket"], resources: [mediaBucket.bucketArn]
    }));
    auth.getUserRole().addToPolicy(new PolicyStatement({
      actions: ["s3:ListObjects", "s3:GetObject"], resources: [mediaBucket.arnForObjects('*')]
    }));
  }
}
