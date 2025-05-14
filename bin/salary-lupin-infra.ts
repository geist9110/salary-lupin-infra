#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend/frontend-stack";
import * as dotenv from "dotenv";
import { DomainStack } from "../lib/domain/DomainStack";
import { VpcStack } from "../lib/network/VpcStack";
import { RdsStack } from "../lib/storage/RdsStack";
import { BackendStack } from "../lib/backend/BackendStack";
import { BackendCertificateStack } from "../lib/cert/BackendCertificateStack";
import { BackendPipeline } from "../lib/cicd/BackendPipeline";

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

const vpcStack = new VpcStack(app, `VpcStack-${environment}`, {
  environment: environment,
  env: {
    account: accountId,
    region: "ap-northeast-2",
  },
});

const backendCertificateStack = new BackendCertificateStack(
  app,
  `BackendCertificateStack-${environment}`,
  {
    environment: environment,
    domainName: domainName,
    env: {
      account: accountId,
      region: "ap-northeast-2",
    },
  },
);

const rdsStack = new RdsStack(app, `RdsStack-${environment}`, {
  environment: environment,
  appName: appName,
  vpc: vpcStack.vpc,
  rdsUserName: rdsUserName,
  env: {
    account: accountId,
    region: "ap-northeast-2",
  },
});

const backendStack = new BackendStack(app, `BackendStack-${environment}`, {
  environment: environment,
  appName: appName,
  vpc: vpcStack.vpc,
  certificate: backendCertificateStack.albCertificate,
  hostedZone: backendCertificateStack.hostedZone,
  env: {
    account: accountId,
    region: "ap-northeast-2",
  },
});

new BackendPipeline(app, `BackendPipeline-${environment}`, {
  environment: environment,
  appName: appName,
  githubRepo: githubRepoBackend,
  githubOwner: githubOwner,
  rdsSecret: rdsStack.dbSecret!,
  rdsPort: rdsStack.dbPort,
  rdsUrl: rdsStack.dbUrl,
  githubConnectionArn: githubConnectionArn,
  githubBranch: githubBranch,
  autoScalingGroup: backendStack.autoScalingGroup,
  env: {
    account: accountId,
    region: "ap-northeast-2",
  },
});

const domainStack = new DomainStack(app, "DomainStack", {
  environment: environment,
  domainName: domainName,
  env: {
    account: accountId,
    region: "us-east-1",
  },
  crossRegionReferences: true,
});

new FrontendStack(app, `FrontendStack-${environment}`, {
  appName: appName,
  environment: environment,
  githubOwner: githubOwner,
  githubFrontendRepo: githubRepoFrontend,
  githubConnectionArn: githubConnectionArn,
  githubBranch: githubBranch,
  certificateArn: domainStack.certificateArn,
  hostedZoneId: domainStack.hostedZoneId,
  hostedZoneName: domainStack.hostedZoneName,
  env: {
    account: accountId,
    region: "ap-northeast-2",
  },
  crossRegionReferences: true,
});
