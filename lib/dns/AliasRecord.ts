import { Construct } from "constructs";
import {
  ARecord,
  IAliasRecordTarget,
  IHostedZone,
  RecordTarget,
} from "aws-cdk-lib/aws-route53";
import { getRecordName } from "../util/domainUtil";

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
      recordName: getRecordName(props.subDomain, props.environment),
      target: RecordTarget.fromAlias(props.recordTarget),
    });
  }
}
