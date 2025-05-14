import { Construct } from "constructs";
import { Peer, Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";

interface LoadBalancerSecurityGroupProps {
  environment: string;
  vpc: Vpc;
}

export class LoadBalancerSecurityGroup extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, props: LoadBalancerSecurityGroupProps) {
    super(scope, `LB-SG-${props.environment}`);

    this.securityGroup = new SecurityGroup(this, `SG-${props.environment}`, {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: "Allow HTTP from anywhere (IPv4 and IPv6)",
    });

    this.securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      "Allow HTTP IPv4",
    );

    this.securityGroup.addIngressRule(
      Peer.anyIpv6(),
      Port.tcp(80),
      "Allow HTTP IPv6",
    );

    this.securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      "Allow HTTPS IPv4",
    );

    this.securityGroup.addIngressRule(
      Peer.anyIpv6(),
      Port.tcp(443),
      "Allow HTTPS IPv6",
    );
  }
}
