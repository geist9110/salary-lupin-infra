import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { getRecordName } from "../util/domainUtil";

interface BackendCertificateStackProps extends StackProps {
  environment: string;
  appName: string;
  domainName: string;
}

export class BackendCertificateStack extends Stack {
  public readonly albCertificate: Certificate;
  public readonly hostedZone: IHostedZone;

  constructor(scope: Construct, props: BackendCertificateStackProps) {
    super(
      scope,
      `${props.appName}-Backend-Certificate-Stack-${props.environment}`,
      props,
    );

    this.hostedZone = route53.HostedZone.fromLookup(
      this,
      `HostedZone-${props.environment}`,
      {
        domainName: props.domainName,
      },
    );

    this.albCertificate = new Certificate(
      this,
      `BackendCertificate-${props.environment}`,
      {
        domainName: `${getRecordName("api", props.environment)}.${props.domainName}`,
        validation: CertificateValidation.fromDns(this.hostedZone),
      },
    );
  }
}
