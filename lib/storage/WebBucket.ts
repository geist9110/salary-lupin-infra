import { Construct } from "constructs";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";

interface WebBucketProps {
  environment: string;
}

export class WebBucket extends Construct {
  public readonly bucket: Bucket;

  constructor(scope: Construct, props: WebBucketProps) {
    super(scope, `Web-Bucket-${props.environment}`);

    this.bucket = new Bucket(this, `S3-${props.environment}`, {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }
}
