import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { getRecordName } from "../util/domainUtil";

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

    const hostedZone = HostedZone.fromLookup(this, `HostedZone`, {
      domainName: props.domainName,
    });

    const certificate = new Certificate(
      this,
      `Certificate-${props.environment}`,
      {
        domainName: `${getRecordName("www", props.environment)}.${props.domainName}`,
        validation: CertificateValidation.fromDns(hostedZone),
      },
    );

    this.hostedZoneName = hostedZone.zoneName;
    this.hostedZoneId = hostedZone.hostedZoneId;
    this.certificateArn = certificate.certificateArn;
  }
}
