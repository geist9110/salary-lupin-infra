#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend/frontend-stack";
import * as dotenv from "dotenv";
import { DomainStack } from "../lib/domain/DomainStack";
import { VpcStack } from "../lib/network/VpcStack";
import { RdsStack } from "../lib/storage/RdsStack";
import { BackendStack } from "../lib/backend/BackendStack";
import { BackendCertificateStack } from "../lib/cert/BackendCertificateStack";

const environment = process.env.NODE_ENV ?? "dev";
dotenv.config({ path: `env/${environment}.env` });

const app = new cdk.App();

const rdsUserName = process.env.RDS_USER_NAME!;

const domainName = process.env.DOMAIN_NAME!;
const accountId = process.env.ACCOUNT_ID!;

const appName = process.env.APP_NAME!;
const githubOwner = process.env.GITHUB_OWNER!;
const githubRepo = process.env.GITHUB_REPO_FRONTEND!;
const githubConnectionArn = process.env.GITHUB_CONNECTION_ARN!;
const githubBranch = process.env.BRANCH!;

const vpcStack = new VpcStack(app, `VpcStack-${environment}`, {
  environment: environment,
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
});

const backendStack = new BackendStack(app, `BackendStack-${environment}`, {
  environment: environment,
  vpc: vpcStack.vpc,
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
  githubFrontendRepo: githubRepo,
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
