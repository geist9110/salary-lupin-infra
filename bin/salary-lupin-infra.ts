#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend/frontend-stack";
import * as dotenv from "dotenv";

const environment = process.env.NODE_ENV ?? "dev";
dotenv.config({ path: `env/${environment}.env` });

const app = new cdk.App();

const appName = process.env.APP_NAME;
const githubOwner = process.env.GITHUB_OWNER;
const githubRepo = process.env.GITHUB_REPO_FRONTEND;
const githubConnectionArn = process.env.GITHUB_CONNECTION_ARN;
const githubBranch = process.env.BRANCH;

if (
  !appName ||
  !githubOwner ||
  !githubRepo ||
  !githubConnectionArn ||
  !githubBranch
) {
  throw new Error(`Check ${environment}.env file`);
}

new FrontendStack(app, `FrontendStack-${environment}`, {
  appName: appName,
  environment: environment,
  githubOwner: githubOwner,
  githubFrontendRepo: githubRepo,
  githubConnectionArn: githubConnectionArn,
  githubBranch: githubBranch,
  env: {
    region: "ap-northeast-2",
  },
});
