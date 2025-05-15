import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import {
  AccessLevel,
  Distribution,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Duration } from "aws-cdk-lib";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

interface SPACloudFrontProps {
  environment: string;
  bucket: Bucket;
  certificateArn: string;
  hostedZoneId: string;
  hostedZoneName: string;
}

export class SPACloudFront extends Construct {
  constructor(scope: Construct, props: SPACloudFrontProps) {
    super(scope, `Web-CF-${props.environment}`);

    const certificate = Certificate.fromCertificateArn(
      this,
      `Certificate-${props.environment}`,
      props.certificateArn,
    );

    const hostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      `HostedZone-${props.environment}`,
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.hostedZoneName,
      },
    );

    const distribution = new Distribution(
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
          `www.${props.environment == "prod" ? "" : props.environment + "."}${hostedZone.zoneName}`,
        ],
        certificate: certificate,
        comment: `Web Distribution ${props.environment}`,
      },
    );

    new ARecord(this, `Web-ARecord-${props.environment}`, {
      zone: hostedZone,
      recordName: `www${props.environment == "prod" ? "" : `.${props.environment}`}`,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });
  }
}
