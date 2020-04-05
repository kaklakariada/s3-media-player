# s3-media-player
Play music stored in an S3 bucket

## Architecture

S3 Media Player uses the following technologies:

* Authentication and Authorization: Cognito
* Static web content: Cloudfront and S3
* Frontend: React and AWS Amplify
* Storage: S3
* Deployment: Cloudformation / CDK

## Deployment to AWS

### Preconitions

To deploy this in your AWS account you will need the following:

* A region where you want to deploy, e.g. `eu-west-1`
* An S3 bucket containing `*.mp3` files, e.g. `my-media-bucket`
* A Route53 hosted zone, e.g. `example.com.`
* A subdomain of `example.com` you want to use for the web app, e.g. `media.example.com`
* An ACM certificate for `media.example.com` or `*.example.com` in `us-east-1` and its ARN `arn:aws:acm:us-east-1:000000000000:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

On your local machine you will need the following:

* [Node.js](https://nodejs.org/en/) 12.x
* [AWS Command line interface](https://aws.amazon.com/cli/)
* Configure AWS credentials for the AWS CLI by calling `aws configure`

### Configure infrastructure

Create file `infrastructure/infrastructure-config.ts` based on the following template and fill in your configuration:

```typescript
import { InfrastructureConfig } from "./lib/infrastructure-config-interface";

export const CONFIG: InfrastructureConfig = {
    stackName: "s3-media-player",
    region: "eu-west-1",
    domain: "media.example.com",
    hostedZoneName: "example.com.",
    sslCertificateArn: "arn:aws:acm:us-east-1:000000000000:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    contactEmailAddress: "admin@example.com",
    mediaBucket: "my-media-bucket"
};
```

#### Setup bucket CORS configuration

Add the following CORS configuration to `my-media-bucket`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
    </CORSRule>
</CORSConfiguration>
```

You can do this by executing the following command:

```bash
aws s3api put-bucket-cors --bucket my-media-bucket --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET"],
      "MaxAgeSeconds": 3000
    }
  ]
}'
```

### Deploy infrastructure

```bash
cd infrastructure
npm run cdk deploy
```

This command will take up to 30 minutes. At the end it will output information you need for configuring the frontend in the next step.

### Configure frontend

Create file `frontend/src/frontend-config.ts` based on the following template and fill in the values for your deployed stack:

```typescript
import { FrontendConfig } from "./environment";

export const CONFIG: FrontendConfig = {
    region: "eu-west-1",
    cognitoIdentityPoolId: "eu-west-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    cognitoUserPoolId: "eu-west-1_xxxxxxxxx",
    cognitoUserPoolWebClientId: "xxxxxxxxxxxxxxxxxxxxxxxxxx",
    mediaBucket: "my-media-bucket"
};
```

Create file `frontend/deploy/deploy-config.js` based on the following template and fill in the values for your deployed stack:

```javascript
exports.CONFIG = {
    staticWebsiteBucket: 'media-staticcontentbucketxxxxxxxxxxxxxxxxxxxxxx',
    cloudfrontDistributionId: 'XXXXXXXXXXXXXX'
}
```

### Deploy frontend

```bash
cd frontend
npm run deploy
```

### Configure backend

#### Create Cognito users

Go to the AWS Cognito console and create users for your new web app. Don't forget to add them to group `Users`.

## Development

### Frontend

Run local frontend during development:

```bash
cd frontend
npm start
```

### Upgrade dependencies in `package.json`

```bash
npx npm-check-updates -u && npm install
```

### Managing configuration in a private branch

This project requires some configuration files with deployment specific information, e.g. domain names that should not be stored in a public git repository. That's why these files are added to `.gitignore`. If you want to still keep your configuration under version control you can do so in a private branch (e.g. `private-master`) that you could push to a private repository only.

When switching from `private-master` to the public `master` branch, git will delete the configuration files. To restore them you can use the following command:

```bash
git show private-master:frontend/deploy/deploy-config.js > frontend/deploy/deploy-config.js \
  && git show private-master:frontend/src/frontend-config.ts > frontend/src/frontend-config.ts \
  && git show private-master:infrastructure/infrastructure-config.ts > infrastructure/infrastructure-config.ts
```

### Troubleshooting

#### Building frontend fails because `./frontend-config` is not found

```.\src\environment.ts
Cannot find file './frontend-config' in '.\src'.
```

Create `frontend/src/frontend-config.ts` as described above.

#### Creating a new account does not work.

Creating an account on the login page fails with message `SignUp is not permitted for this user pool`.

Registering of new users is deactivated for the Cognito user pool. You can change this by setting `allowAdminCreateUserOnly` to `false` in `cognito.ts`.
