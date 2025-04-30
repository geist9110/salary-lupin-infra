#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend/frontend-stack";
import * as dotenv from "dotenv";

const env = process.env.NODE_ENV ?? "dev";
dotenv.config({ path: `env/${env}.env` });

const app = new cdk.App();

new FrontendStack(app, `FrontendStack-${env}`, {
  env: {
    region: "ap-northeast-2",
  },
});
