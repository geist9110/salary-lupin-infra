import { Duration, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Ec2Service } from "aws-cdk-lib/aws-ecs";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { BackendSecurityGroup } from "./BackendSecurityGroup";
import { BackendEcsInfra } from "./BackendEcsInfra";
import { BackendEcsTask } from "./BackendEcsTask";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";

interface BackendStackProps {
  environment: string;
  vpc: Vpc;
}

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id);

    const securityGroup = new BackendSecurityGroup(
      this,
      `Backend-SecurityGroup-${props.environment}`,
      {
        environment: props.environment,
        vpc: props.vpc,
      },
    );

    const ecsInfra = new BackendEcsInfra(
      this,
      `Backend-ECS-Infra-${props.environment}`,
      {
        environment: props.environment,
        vpc: props.vpc,
        securityGroup: securityGroup.ecsSecurityGroup,
      },
    );
    const ecsTask = new BackendEcsTask(
      this,
      `Backend-ECS-Task-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    const ecsService = new Ec2Service(
      this,
      `Backend-Service-${props.environment}`,
      {
        cluster: ecsInfra.cluster,
        taskDefinition: ecsTask.taskDefinition,
      },
    );

    const lb = new ApplicationLoadBalancer(
      this,
      `Backend-LoadBalancer-${props.environment}`,
      {
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: SubnetType.PUBLIC,
        }),
        securityGroup: securityGroup.loadBalancerSecurityGroup,
        internetFacing: true,
      },
    );

    const listener = lb.addListener(
      `Backend-LoadBalancer-Listener-${props.environment}`,
      { port: 80 },
    );

    listener.addTargets(`Backend-Loadbalancer-Target-${props.environment}`, {
      port: 80,
      targets: [ecsService],
      healthCheck: {
        path: "/",
        interval: Duration.seconds(30),
      },
    });
  }
}
