#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend/frontend-stack";

const app = new cdk.App();

new FrontendStack(app, "FrontendStack", {
  env: {
    region: "ap-northeast-2",
  },
});
