import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

interface VpcStackProps extends StackProps {
  environment: string;
}

export class VpcStack extends Stack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, `Salary-lupin-VPC-${props.environment}`, {
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
