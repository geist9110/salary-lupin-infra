import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

interface DomainStackProps extends StackProps {
  domainName: string;
}

export class DomainStack extends Stack {
  public readonly hostedZone: route53.IHostedZone;
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: DomainStackProps) {
    super(scope, id, props);

    this.hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    this.certificate = new acm.Certificate(this, "DomainCertification", {
      domainName: `*.${props.domainName}`,
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });
  }
}
