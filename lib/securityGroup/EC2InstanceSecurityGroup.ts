import { Construct } from "constructs";
import { Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";

interface EC2InstanceSecurityGroupProps {
  environment: string;
  vpc: Vpc;
  loadBalancerSecurityGroup: SecurityGroup;
}

export class EC2InstanceSecurityGroup extends Construct {
  public readonly securityGroup: SecurityGroup;
  private readonly SERVER_PORT: number = 8080;

  constructor(scope: Construct, props: EC2InstanceSecurityGroupProps) {
    super(scope, `EC2-SG-${props.environment}`);

    this.securityGroup = new SecurityGroup(this, `SG-${props.environment}`, {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: "Allow HTTP from LoadBalancer",
    });

    this.securityGroup.addIngressRule(
      props.loadBalancerSecurityGroup,
      Port.tcp(this.SERVER_PORT),
      `Allow traffic from LoadBalancer to EC2 (port ${this.SERVER_PORT})`,
    );
  }
}
