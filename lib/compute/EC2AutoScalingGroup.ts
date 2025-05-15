import { Construct } from "constructs";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Role } from "aws-cdk-lib/aws-iam";
import { Tags } from "aws-cdk-lib";

interface EC2AutoScalingGroupProps {
  environment: string;
  vpc: Vpc;
  securityGroup: SecurityGroup;
  role: Role;
}

export class EC2AutoScalingGroup extends Construct {
  public readonly autoScalingGroup: AutoScalingGroup;

  constructor(scope: Construct, props: EC2AutoScalingGroupProps) {
    super(scope, `EC2-ASG-${props.environment}`);

    this.autoScalingGroup = new AutoScalingGroup(
      this,
      `ASG-${props.environment}`,
      {
        vpc: props.vpc,
        securityGroup: props.securityGroup,
        vpcSubnets: { subnetType: SubnetType.PUBLIC },
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
        machineImage: MachineImage.latestAmazonLinux2023(),
        minCapacity: 0,
        maxCapacity: 2,
        desiredCapacity: 1,
        role: props.role,
      },
    );

    Tags.of(this.autoScalingGroup).add("env", props.environment, {
      applyToLaunchedInstances: true,
    });
  }
}
