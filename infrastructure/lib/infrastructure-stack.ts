import { Stack, StackProps } from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { CognitoAuthConstruct } from "./auth";
import { DatabaseConstruct } from "./database";
import { StaticContentConstruct } from "./static-content";

export interface InfrastructureStackProps extends StackProps {
  domain: string;
  hostedZoneName: string;
  sslCertificateArn: string;
  contactEmailAddress: string;
  mediaBucket: string;
}

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    new StaticContentConstruct(this, 'StaticContent', {
      domain: props.domain,
      hostedZoneName: props.hostedZoneName,
      sslCertificateArn: props.sslCertificateArn
    });

    const db = new DatabaseConstruct(this, 'Database', {});

    const auth = new CognitoAuthConstruct(this, 'Auth', {
      contactEmailAddress: props.contactEmailAddress,
      domain: props.domain
    });

    auth.getUserRole().addToPolicy(new PolicyStatement({
      actions: ["dynamodb:Select"], resources: [db.table.tableArn]
    }));

    const mediaBucket = Bucket.fromBucketName(this, 'MediaBucket', props.mediaBucket);
    auth.getUserRole().addToPolicy(new PolicyStatement({
      actions: ["s3:ListBucket"], resources: [mediaBucket.bucketArn]
    }));
    auth.getUserRole().addToPolicy(new PolicyStatement({
      actions: ["s3:ListObjects", "s3:GetObject"], resources: [mediaBucket.arnForObjects('*')]
    }));
  }
}
