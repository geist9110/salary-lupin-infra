import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

interface VpcStackProps extends StackProps {
  environment: string;
  appName: string;
}

export class VpcStack extends Stack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, props: VpcStackProps) {
    super(scope, `${props.appName}-Vpc-Stack-${props.environment}`, props);

    this.vpc = new Vpc(this, `VPC-${props.environment}`, {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "public-subnet",
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: "private-subnet",
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
  }
}
