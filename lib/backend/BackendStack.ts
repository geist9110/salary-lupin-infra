import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  AsgCapacityProvider,
  Cluster,
  ContainerImage,
  Ec2Service,
  Ec2TaskDefinition,
  EcsOptimizedImage,
  Protocol,
} from "aws-cdk-lib/aws-ecs";
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

    const cluster = new Cluster(
      this,
      `Backend-Cluster-${props.environment}`,
      {},
    );

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

    const capacityProvider = new AsgCapacityProvider(
      this,
      `Backend-ASG-CapacityProvider-${props.environment}`,
      { autoScalingGroup: autoScalingGroup },
    );

    cluster.addAsgCapacityProvider(capacityProvider);

    const taskDefinition = new Ec2TaskDefinition(
      this,
      `Backend-TaskDef-${props.environment}`,
    );

    taskDefinition.addContainer(`Backend-Task-Container`, {
      image: ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
      portMappings: [
        {
          containerPort: 80,
          protocol: Protocol.TCP,
        },
      ],
    });

    new Ec2Service(this, `Backend-Service-${props.environment}`, {
      cluster: cluster,
      taskDefinition: taskDefinition,
    });
  }
}
