import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  TargetType,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Ec2Service } from "aws-cdk-lib/aws-ecs";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

interface BackendLoadBalancerProps {
  environment: string;
  vpc: Vpc;
  securityGroup: SecurityGroup;
  target: Ec2Service;
  certificate: Certificate;
}

export class BackendLoadBalancer extends Construct {
  public readonly applicationLoadBalancer: ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: BackendLoadBalancerProps) {
    super(scope, id);

    this.applicationLoadBalancer = new ApplicationLoadBalancer(
      this,
      `Backend-ALB-${props.environment}`,
      {
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: SubnetType.PUBLIC,
        }),
        securityGroup: props.securityGroup,
        internetFacing: true,
      },
    );

    const httpListener = this.applicationLoadBalancer.addListener(
      `Backend-ALB-Listener-${props.environment}`,
      { port: 80 },
    );

    const httpsListener = this.applicationLoadBalancer.addListener(
      `Backend-ALB-https-listener-${props.environment}`,
      { port: 443, certificates: [props.certificate] },
    );

    const targetGroup = new ApplicationTargetGroup(
      this,
      `Backend-ALB-TargetGroups-${props.environment}`,
      {
        vpc: props.vpc,
        port: 80,
        protocol: ApplicationProtocol.HTTP,
        targetType: TargetType.INSTANCE,
        targets: [props.target],
        healthCheck: {
          path: "/",
          interval: Duration.seconds(30),
        },
      },
    );

    httpListener.addTargetGroups(`Add-Backend-TG-Http-${props.environment}`, {
      targetGroups: [targetGroup],
    });

    httpsListener.addTargetGroups(`Add-Backend-TG-Https-${props.environment}`, {
      targetGroups: [targetGroup],
    });
  }
}
