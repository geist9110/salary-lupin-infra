import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  TargetType,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

interface BackendLoadBalancerProps {
  environment: string;
  vpc: Vpc;
  securityGroup: SecurityGroup;
  certificate: Certificate;
}

export class BackendLoadBalancer extends Construct {
  public readonly applicationLoadBalancer: ApplicationLoadBalancer;
  public readonly targetGroup: ApplicationTargetGroup;

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

    this.targetGroup = new ApplicationTargetGroup(
      this,
      `Backend-ALB-TargetGroups-${props.environment}`,
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

    httpListener.addTargetGroups(`Add-Backend-TG-Http-${props.environment}`, {
      targetGroups: [this.targetGroup],
    });

    httpsListener.addTargetGroups(`Add-Backend-TG-Https-${props.environment}`, {
      targetGroups: [this.targetGroup],
    });
  }
}
