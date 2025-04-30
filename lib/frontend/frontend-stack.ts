import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { FrontendCodeBuild } from "./FrontendCodeBuild";

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const env = process.env.NODE_ENV ?? "dev";

    const frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: process.env.FRONTEND_BUCKET_NAME,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const PipelineSourceBucket = new s3.Bucket(this, "PipelineSourceBucket", {
      bucketName: `frontend-codepipeline-source-${env}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const codeBuild = new FrontendCodeBuild(this, "CodeBuild", env);
  }
}
