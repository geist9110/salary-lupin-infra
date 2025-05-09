import { Construct } from "constructs";
import { Peer, Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";

interface BackendSecurityGroupProps {
  environment: string;
  vpc: Vpc;
}

export class BackendSecurityGroup extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: BackendSecurityGroupProps) {
    super(scope, id);

    this.securityGroup = new SecurityGroup(
      this,
      `SecurityGroup-${props.environment}`,
      {
        vpc: props.vpc,
        allowAllOutbound: true,
        description: "Allow HTTP from anywhere (IPv4 and IPv6)",
      },
    );

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
  }
}
