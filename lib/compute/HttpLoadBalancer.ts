import { Construct } from "constructs";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  TargetType,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
import { Duration } from "aws-cdk-lib";

interface HttpLoadBalancerProps {
  environment: string;
  vpc: Vpc;
  securityGroup: SecurityGroup;
  certificate: Certificate;
  autoScalingGroup: AutoScalingGroup;
}

export class HttpLoadBalancer extends Construct {
  public readonly loadBalancer: ApplicationLoadBalancer;

  constructor(scope: Construct, props: HttpLoadBalancerProps) {
    super(scope, `Http-ALB-${props.environment}`);

    this.loadBalancer = new ApplicationLoadBalancer(
      this,
      `LoadBalancer-${props.environment}`,
      {
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: SubnetType.PUBLIC,
        }),
        securityGroup: props.securityGroup,
        internetFacing: true,
      },
    );

    const httpListener = this.loadBalancer.addListener(
      `Http-Listener-${props.environment}`,
      {
        port: 80,
      },
    );

    const httpsListener = this.loadBalancer.addListener(
      `Https-Listener-${props.environment}`,
      { port: 443, certificates: [props.certificate] },
    );

    const targetGroup = new ApplicationTargetGroup(
      this,
      `ALB-TG-${props.environment}`,
      {
        vpc: props.vpc,
        port: 8080,
        protocol: ApplicationProtocol.HTTP,
        targetType: TargetType.INSTANCE,
        healthCheck: {
          path: "/actuator/health",
          interval: Duration.seconds(30),
        },
      },
    );

    httpListener.addTargetGroups(`Http-TG-${props.environment}`, {
      targetGroups: [targetGroup],
    });

    httpsListener.addTargetGroups(`Https-TG-${props.environment}`, {
      targetGroups: [targetGroup],
    });

    props.autoScalingGroup.attachToApplicationTargetGroup(targetGroup);
  }
}
