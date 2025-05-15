import { Construct } from "constructs";
import {
  ARecord,
  IAliasRecordTarget,
  IHostedZone,
  RecordTarget,
} from "aws-cdk-lib/aws-route53";

interface AliasRecordProps {
  environment: string;
  hostedZone: IHostedZone;
  subDomain: string;
  recordTarget: IAliasRecordTarget;
}

export class AliasRecord extends Construct {
  constructor(scope: Construct, props: AliasRecordProps) {
    super(scope, `AliasRecord-${props}`);

    new ARecord(this, `Record-${props.environment}`, {
      zone: props.hostedZone,
      recordName: this.getRecordName(props.subDomain, props.environment),
      target: RecordTarget.fromAlias(props.recordTarget),
    });
  }

  private getRecordName(subDomain: string, environment: string): string {
    return `${subDomain}${this.isProduction(environment) ? "" : "." + environment}}`;
  }

  private isProduction(environment: string): boolean {
    return environment == "prod";
  }
}
