#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend/frontend-stack";
import * as dotenv from "dotenv";
import { DomainStack } from "../lib/domain/DomainStack";

const environment = process.env.NODE_ENV ?? "dev";
dotenv.config({ path: `env/${environment}.env` });

const app = new cdk.App();

const domainName = process.env.DOMAIN_NAME;
const accountId = process.env.ACCOUNT_ID;

const appName = process.env.APP_NAME;
const githubOwner = process.env.GITHUB_OWNER;
const githubRepo = process.env.GITHUB_REPO_FRONTEND;
const githubConnectionArn = process.env.GITHUB_CONNECTION_ARN;
const githubBranch = process.env.BRANCH;

if (
  !domainName ||
  !accountId ||
  !appName ||
  !githubOwner ||
  !githubRepo ||
  !githubConnectionArn ||
  !githubBranch
) {
  throw new Error(`Check ${environment}.env file`);
}

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
