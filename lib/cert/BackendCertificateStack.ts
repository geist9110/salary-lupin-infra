import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

interface BackendCertificateStackProps extends StackProps {
  environment: string;
  domainName: string;
}

export class BackendCertificateStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: BackendCertificateStackProps,
  ) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    const albCertificate = new Certificate(
      this,
      `BackendCertificate-${props.environment}`,
      {
        domainName: `api.${props.environment == "prod" ? "" : props.environment + "."}${props.domainName}`,
        validation: CertificateValidation.fromDns(hostedZone),
      },
    );

    new StringParameter(this, `BackendAlbCertificateArn-${props.environment}`, {
      parameterName: `/infra/${props.environment}/alb-certificate-arn`,
      stringValue: albCertificate.certificateArn,
    });
  }
}
