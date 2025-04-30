import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface FrontendCloudfrontProps {
  environment: string;
  bucket: s3.Bucket;
}

export class FrontendCloudfront extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FrontendCloudfrontProps) {
    super(scope, id);

    this.distribution = new cloudfront.Distribution(
      this,
      "FrontendDistribution",
      {
        comment: `Frontend distribution for ${props.environment}`,
        defaultBehavior: this.getDefaultBehavior(props.bucket),
        defaultRootObject: "index.html",
        errorResponses: this.getErrorResponse(),
      },
    );
  }

  private getDefaultBehavior(bucket: s3.Bucket): cloudfront.BehaviorOptions {
    return {
      origin: origins.S3BucketOrigin.withOriginAccessControl(bucket, {
        originAccessLevels: [
          cloudfront.AccessLevel.READ,
          cloudfront.AccessLevel.LIST,
        ],
      }),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };
  }

  private getErrorResponse(): cloudfront.ErrorResponse[] {
    return [
      {
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: "/index.html",
        ttl: cdk.Duration.minutes(0),
      },
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: "/index.html",
        ttl: cdk.Duration.minutes(0),
      },
    ];
  }
}
