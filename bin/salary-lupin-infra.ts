#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/apps/FrontendStack";
import * as dotenv from "dotenv";
import { FrontendCertificateStack } from "../lib/cert/FrontendCertificateStack";
import { VpcStack } from "../lib/network/VpcStack";
import { RdsStack } from "../lib/storage/RdsStack";
import { BackendStack } from "../lib/apps/BackendStack";
import { BackendCertificateStack } from "../lib/cert/BackendCertificateStack";
import { SecurityGroupStack } from "../lib/securityGroup/SecurityGroupStack";

const environment = process.env.NODE_ENV ?? "dev";
dotenv.config({ path: `env/${environment}.env` });

const app = new cdk.App();

const rdsUserName = process.env.RDS_USER_NAME!;

const domainName = process.env.DOMAIN_NAME!;
const accountId = process.env.ACCOUNT_ID!;

const appName = process.env.APP_NAME!;
const githubOwner = process.env.GITHUB_OWNER!;
const githubRepoFrontend = process.env.GITHUB_REPO_FRONTEND!;
const githubRepoBackend = process.env.GITHUB_REPO_BACKEND!;
const githubConnectionArn = process.env.GITHUB_CONNECTION_ARN!;
const githubBranch = process.env.BRANCH!;

const keyPairName = process.env.KEY_PAIR_NAME!;

const vpcStack = new VpcStack(app, {
  environment: environment,
  appName: appName,
  env: {
    account: accountId,
    region: "ap-northeast-2",
  },
});

const backendCertificateStack = new BackendCertificateStack(app, {
  environment: environment,
  appName: appName,
  domainName: domainName,
  env: {
    account: accountId,
    region: "ap-northeast-2",
  },
});

const frontendCertificateStack = new FrontendCertificateStack(app, {
  environment: environment,
  appName: appName,
  domainName: domainName,
  env: {
    account: accountId,
    region: "us-east-1",
  },
  crossRegionReferences: true,
});

const securityGroup = new SecurityGroupStack(app, {
  environment: environment,
  appName: appName,
  vpc: vpcStack.vpc,
  env: {
    account: accountId,
    region: "ap-northeast-2",
  },
});

const rdsStack = new RdsStack(app, {
  environment: environment,
  appName: appName,
  vpc: vpcStack.vpc,
  rdsUserName: rdsUserName,
  securityGroup: securityGroup.rds,
  env: {
    account: accountId,
    region: "ap-northeast-2",
  },
});

new BackendStack(app, {
  environment: environment,
  appName: appName,
  vpc: vpcStack.vpc,
  certificate: backendCertificateStack.albCertificate,
  hostedZone: backendCertificateStack.hostedZone,
  loadBalancerSecurityGroup: securityGroup.loadBalancer,
  ec2SecurityGroup: securityGroup.ec2,
  rdsSecret: rdsStack.dbSecret!,
  rdsPort: rdsStack.dbPort,
  rdsUrl: rdsStack.dbUrl,
  github: {
    owner: githubOwner,
    connectionArn: githubConnectionArn,
    repository: githubRepoBackend,
    branch: githubBranch,
  },
  domainName: domainName,
  keyPairName: keyPairName,
  env: {
    account: accountId,
    region: "ap-northeast-2",
  },
});

new FrontendStack(app, {
  appName: appName,
  environment: environment,
  github: {
    owner: githubOwner,
    connectionArn: githubConnectionArn,
    repository: githubRepoFrontend,
    branch: githubBranch,
  },
  certificateArn: frontendCertificateStack.certificateArn,
  hostedZoneId: frontendCertificateStack.hostedZoneId,
  hostedZoneName: frontendCertificateStack.hostedZoneName,
  domainName: domainName,
  env: {
    account: accountId,
    region: "ap-northeast-2",
  },
  crossRegionReferences: true,
});
