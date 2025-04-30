import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

interface DomainStackProps extends StackProps {
  environment: string;
  domainName: string;
}

export class DomainStack extends Stack {
  public readonly hostedZoneName: string;
  public readonly hostedZoneId: string;
  public readonly certificateArn: string;

  constructor(scope: Construct, id: string, props: DomainStackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    const isProd = props.environment === "prod";
    const mainDomain = isProd
      ? `*.${props.domainName}`
      : `*.${props.environment}.${props.domainName}`;

    const altNames = isProd
      ? [props.domainName]
      : [`${props.environment}.${props.domainName}`];

    const certificate = new acm.Certificate(this, "DomainCertification", {
      domainName: mainDomain,
      subjectAlternativeNames: altNames,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    this.hostedZoneName = hostedZone.zoneName;
    this.hostedZoneId = hostedZone.hostedZoneId;
    this.certificateArn = certificate.certificateArn;
  }
}
