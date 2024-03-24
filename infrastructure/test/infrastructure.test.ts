import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from 'aws-cdk-lib';
import Infrastructure = require('../lib/infrastructure-stack');

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Infrastructure.InfrastructureStack(app, 'MyTestStack', {
    domain: "domain",
    hostedZoneName: "hostedZone",
    sslCertificateArn: "sslCert",
    contactEmailAddress: "email",
    mediaBucket: "bucket"
  });
  // THEN
  expectCDK(stack).to(matchTemplate({
    "Resources": {}
  }, MatchStyle.SUPERSET))
});
