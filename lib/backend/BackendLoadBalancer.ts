import { Duration, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  TargetType,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Ec2Service } from "aws-cdk-lib/aws-ecs";

interface BackendLoadBalancerProps {
  environment: string;
  vpc: Vpc;
  securityGroup: SecurityGroup;
  target: Ec2Service;
}

export class BackendLoadBalancer extends Stack {
  constructor(scope: Construct, id: string, props: BackendLoadBalancerProps) {
    super(scope, id);

    const lb = new ApplicationLoadBalancer(
      this,
      `Backend-ApplicationLoadBalancer-${props.environment}`,
      {
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: SubnetType.PUBLIC,
        }),
        securityGroup: props.securityGroup,
        internetFacing: true,
      },
    );

    const listener = lb.addListener(
      `Backend-ApplicationLoadBalancer-Listener-${props.environment}`,
      { port: 80 },
    );

    const targetGroup = new ApplicationTargetGroup(
      this,
      `Backend-ApplicationLoadBalancer-TargetGroups-${props.environment}`,
      {
        vpc: props.vpc,
        port: 80,
        protocol: ApplicationProtocol.HTTP,
        targetType: TargetType.INSTANCE,
        healthCheck: {
          path: "/",
          interval: Duration.seconds(30),
        },
      },
    );

    listener.addTargetGroups(`Add-BackendTargetGroup-${props.environment}`, {
      targetGroups: [targetGroup],
    });
  }
}
