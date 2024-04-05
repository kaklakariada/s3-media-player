import { CfnOutput, Duration } from "aws-cdk-lib";
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment, CfnUserPool, CfnUserPoolClient, CfnUserPoolGroup } from "aws-cdk-lib/aws-cognito";
import { FederatedPrincipal, Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface CognitoAuthProps {
  domain: string;
  contactEmailAddress: string;
}
export class CognitoAuthConstruct extends Construct {

  private userRole: Role;

  getUserRole() {
    return this.userRole;
  }

  constructor(scope: Construct, id: string, props: CognitoAuthProps) {
    super(scope, id);
    const userPool = new CfnUserPool(this, "UserPool", {
      userPoolName: "S3MediaPlayerUserPool-" + id,
      deletionProtection: "INACTIVE",
      userPoolAddOns: {
        advancedSecurityMode: "ENFORCED"
      },
      adminCreateUserConfig: {
        allowAdminCreateUserOnly: true,
        unusedAccountValidityDays: 7,
        inviteMessageTemplate: {
          emailSubject: `S3 Media Player ${props.domain} - Invitation`,
          emailMessage: `Hi {username}!
We created a user account with name {username} for you.
Your initial password is {####}.
Please go to https://${props.domain} and change your password.
If you have any questions, please contact ${props.contactEmailAddress}`
        },
      },
      aliasAttributes: ["preferred_username", "email"],
      autoVerifiedAttributes: ["email"],
      deviceConfiguration: {
        challengeRequiredOnNewDevice: false,
        deviceOnlyRememberedOnUserPrompt: false
      },
      emailConfiguration: {
        replyToEmailAddress: props.contactEmailAddress
      },
      emailVerificationSubject: `S3 Media Player ${props.domain} - Email verification`,
      emailVerificationMessage: `Hi!
      To verify your email address at ${props.domain} please enter this code: {####}.
      If you have any questions, please contact ${props.contactEmailAddress}`,
      mfaConfiguration: "OFF",
      enabledMfas: [],
      policies: {
        passwordPolicy: {
          minimumLength: 6,
          requireLowercase: true,
          requireNumbers: false,
          requireSymbols: true,
          requireUppercase: true
        }
      }
    });

    const webClient = new CfnUserPoolClient(this, "Client", {
      generateSecret: false,
      userPoolId: userPool.ref,
      allowedOAuthFlowsUserPoolClient: false,
      refreshTokenValidity: 30, // days
      accessTokenValidity: 2, // hours
      idTokenValidity: 2, // hours
      tokenValidityUnits: {
        refreshToken: "days",
        accessToken: "hours",
        idToken: "hours"
      },
      preventUserExistenceErrors: "ENABLED",
      supportedIdentityProviders: ["COGNITO"],
      authSessionValidity: 15, // minutes
      readAttributes: ["preferred_username"],
      writeAttributes: []
    });

    const identityPool = new CfnIdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: webClient.ref,
        providerName: userPool.attrProviderName,
        serverSideTokenCheck: true
      }]
    });

    this.userRole = new Role(this, "UserRole", {
      maxSessionDuration: Duration.hours(3),
      assumedBy: new FederatedPrincipal("cognito-identity.amazonaws.com", {
        "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
        "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" }
      }, "sts:AssumeRoleWithWebIdentity")
    });

    new CfnUserPoolGroup(this, "UserGroup", {
      groupName: "Users",
      description: "Group for users",
      roleArn: this.userRole.roleArn,
      userPoolId: userPool.ref,
      precedence: 10
    });

    new CfnIdentityPoolRoleAttachment(this, "RoleAttachment", {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: this.userRole.roleArn
      },
      roleMappings: {
        userpool1: {
          identityProvider: `${userPool.attrProviderName}:${webClient.ref}`,
          ambiguousRoleResolution: "Deny",
          type: "Token"
        }
      }
    });

    new CfnOutput(this, "IdentityPoolId", {
      description: "IdentityPoolId",
      value: identityPool.ref
    });

    new CfnOutput(this, "UserPoolId", {
      description: "UserPoolId",
      value: userPool.ref
    });

    new CfnOutput(this, "ClientId", {
      description: "ClientId",
      value: webClient.ref
    });
  }
}
