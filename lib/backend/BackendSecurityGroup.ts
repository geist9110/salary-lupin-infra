import { Construct } from "constructs";
import { Peer, Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";

interface BackendSecurityGroupProps {
  environment: string;
  vpc: Vpc;
}

export class BackendSecurityGroup extends Construct {
  public readonly loadBalancerSecurityGroup: SecurityGroup;
  public readonly ecsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: BackendSecurityGroupProps) {
    super(scope, id);

    this.loadBalancerSecurityGroup = new SecurityGroup(
      this,
      `Backend-LoadBalancer-SecurityGroup-${props.environment}`,
      {
        vpc: props.vpc,
        allowAllOutbound: true,
        description: "Allow HTTP from anywhere (IPv4 and IPv6)",
      },
    );

    this.loadBalancerSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      "Allow HTTP IPv4",
    );

    this.loadBalancerSecurityGroup.addIngressRule(
      Peer.anyIpv6(),
      Port.tcp(80),
      "Allow HTTP IPv6",
    );

    this.loadBalancerSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      "Allow HTTPS IPv4",
    );

    this.loadBalancerSecurityGroup.addIngressRule(
      Peer.anyIpv6(),
      Port.tcp(443),
      "Allow HTTPS IPv6",
    );

    this.ecsSecurityGroup = new SecurityGroup(
      this,
      `Backend-ECS-SecurityGroup-${props.environment}`,
      {
        vpc: props.vpc,
        allowAllOutbound: true,
        description: "Allow HTTP from LoadBalancer",
      },
    );

    this.ecsSecurityGroup.addIngressRule(
      this.loadBalancerSecurityGroup,
      Port.tcp(80),
      "Allow HTTP from Loadbalancer",
    );
  }
}
