import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Cluster, EcsOptimizedImage } from "aws-cdk-lib/aws-ecs";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";

interface BackendStackProps {
  environment: string;
  vpc: Vpc;
}

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id);

    const ecs = new Cluster(this, `Backend-Cluster-${props.environment}`, {
      vpc: props.vpc,
    });

    const autoScalingGroup = new AutoScalingGroup(
      this,
      `Backend-AutoScaling-Group-${props.environment}`,
      {
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        }),
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
        machineImage: EcsOptimizedImage.amazonLinux2(),
        desiredCapacity: 1,
      },
    );
  }
}
