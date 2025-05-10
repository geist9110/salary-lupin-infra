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
import { StringParameter } from "aws-cdk-lib/aws-ssm";

interface BackendLoadBalancerProps {
  environment: string;
  vpc: Vpc;
  securityGroup: SecurityGroup;
  target: Ec2Service;
}

export class BackendLoadBalancer extends Construct {
  public readonly applicationLoadBalancer: ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: BackendLoadBalancerProps) {
    super(scope, id);

    const certArn = StringParameter.valueForStringParameter(
      this,
      `/infra/${props.environment}/alb-certificate-arn`,
    );

    const albCertificate = Certificate.fromCertificateArn(
      this,
      `Backend-ALB-Certificate-${props.environment}`,
      certArn,
    );

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
      { port: 443, certificates: [albCertificate] },
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
