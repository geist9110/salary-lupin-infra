import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { Vpc } from "aws-cdk-lib/aws-ec2";

interface BackendStackProps {
  environment: string;
  vpc: Vpc;
}

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id);

    const ecs = new Cluster(this, `BackendCluster-${props.environment}`, {
      vpc: props.vpc,
    });
  }
}
