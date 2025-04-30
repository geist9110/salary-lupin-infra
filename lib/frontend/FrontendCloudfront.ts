import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";

interface FrontendCloudfrontProps {
  environment: string;
  bucket: s3.Bucket;
  certificateArn: string;
  hostedZoneId: string;
  hostedZoneName: string;
}

export class FrontendCloudfront extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FrontendCloudfrontProps) {
    super(scope, id);

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "ImportedCertificate",
      props.certificateArn,
    );

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "ImportedHostedZone",
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.hostedZoneName,
      },
    );

    const subdomainPrefix =
      props.environment === "prod" ? "www" : `www.${props.environment}`;
    const domainFullName = `${subdomainPrefix}.${hostedZone.zoneName}`;

    this.distribution = new cloudfront.Distribution(
      this,
      "FrontendDistribution",
      {
        comment: `Frontend distribution for ${props.environment}`,
        defaultBehavior: this.getDefaultBehavior(props.bucket),
        defaultRootObject: "index.html",
        domainNames: [domainFullName],
        certificate: certificate,
        errorResponses: this.getErrorResponse(),
      },
    );

    new route53.ARecord(this, "FrontendAliasRecord", {
      zone: hostedZone,
      recordName: subdomainPrefix,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(this.distribution),
      ),
    });
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
