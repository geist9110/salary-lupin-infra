import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";

interface FrontendBucketProps {
  appName: string;
  environment: string;
}

export class FrontendBucket extends Construct {
  public readonly frontendBucket: s3.Bucket;
  public readonly pipelineArtifactBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: FrontendBucketProps) {
    super(scope, id);

    this.frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `${props.appName}-${props.environment}-frontend-bucket`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.pipelineArtifactBucket = new s3.Bucket(
      this,
      "PipelineArtifactBucket",
      {
        bucketName: `${props.appName}-${props.environment}-pipeline-artifact-bucket`,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      },
    );
  }
}
