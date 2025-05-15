import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

interface FrontendCertificateStackProps extends StackProps {
  environment: string;
  domainName: string;
}

export class FrontendCertificateStack extends Stack {
  public readonly hostedZoneName: string;
  public readonly hostedZoneId: string;
  public readonly certificateArn: string;

  constructor(scope: Construct, props: FrontendCertificateStackProps) {
    super(scope, `Frontend-Certificate-Stack-${props.environment}`, props);

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    const certificate = new acm.Certificate(
      this,
      `Certificate-${props.environment}`,
      {
        domainName: `www.${props.environment == "prod" ? "" : props.environment + "."}${props.domainName}`,
        validation: acm.CertificateValidation.fromDns(hostedZone),
      },
    );

    this.hostedZoneName = hostedZone.zoneName;
    this.hostedZoneId = hostedZone.hostedZoneId;
    this.certificateArn = certificate.certificateArn;
  }
}
