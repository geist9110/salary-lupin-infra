import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";

interface ArtifactBucketProps {
  environment: string;
}

export class ArtifactBucket extends Construct {
  public readonly bucket: Bucket;

  constructor(scope: Construct, props: ArtifactBucketProps) {
    super(scope, `ArtifactBucket-${props.environment}`);

    this.bucket = new Bucket(this, `S3-${props.environment}`, {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }
}
