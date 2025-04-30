import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";

export class FrontendBucket extends Construct {
  public readonly frontendBucket: s3.Bucket;
  public readonly pipelineArtifactBucket: s3.Bucket;

  constructor(scope: Construct, id: string, environment: string) {
    super(scope, id);

    this.frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `salary-lupin-${environment}-frontend-bucket`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.pipelineArtifactBucket = new s3.Bucket(this, "PipelineSourceBucket", {
      bucketName: `salary-lupin-${environment}-pipeline-artifact-bucket`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }
}
