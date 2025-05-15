import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import {
  AccessLevel,
  Distribution,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Duration } from "aws-cdk-lib";

interface SPACloudFrontProps {
  environment: string;
  bucket: Bucket;
  certificateArn: string;
  hostedZone: IHostedZone;
}

export class SPACloudFront extends Construct {
  public readonly distribution: Distribution;

  constructor(scope: Construct, props: SPACloudFrontProps) {
    super(scope, `Web-CF-${props.environment}`);

    const certificate = Certificate.fromCertificateArn(
      this,
      `Certificate-${props.environment}`,
      props.certificateArn,
    );

    this.distribution = new Distribution(
      this,
      `Distribution-${props.environment}`,
      {
        defaultBehavior: {
          origin: S3BucketOrigin.withOriginAccessControl(props.bucket, {
            originAccessLevels: [AccessLevel.READ, AccessLevel.LIST],
          }),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: Duration.seconds(0),
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: Duration.seconds(0),
          },
        ],
        domainNames: [
          `www.${props.environment == "prod" ? "" : props.environment + "."}${props.hostedZone.zoneName}`,
        ],
        certificate: certificate,
        comment: `Web Distribution ${props.environment}`,
      },
    );
  }
}
