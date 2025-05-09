import { Construct } from "constructs";
import {
  AsgCapacityProvider,
  Cluster,
  EcsOptimizedImage,
} from "aws-cdk-lib/aws-ecs";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";

interface BackendEcsInfraProps {
  environment: string;
  vpc: Vpc;
  securityGroup: SecurityGroup;
}

export class BackendEcsInfra extends Construct {
  public readonly cluster: Cluster;

  constructor(scope: Construct, id: string, props: BackendEcsInfraProps) {
    super(scope, id);

    this.cluster = new Cluster(
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
          subnetType: SubnetType.PUBLIC,
        }),
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
        machineImage: EcsOptimizedImage.amazonLinux2(),
        minCapacity: 0,
        maxCapacity: 1,
        desiredCapacity: 1,
        securityGroup: props.securityGroup,
      },
    );

    const capacityProvider = new AsgCapacityProvider(
      this,
      `Backend-ASG-CapacityProvider-${props.environment}`,
      { autoScalingGroup: autoScalingGroup },
    );

    this.cluster.addAsgCapacityProvider(capacityProvider);
  }
}
