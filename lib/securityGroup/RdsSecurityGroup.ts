import { Construct } from "constructs";
import { Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";

interface RdsSecurityGroupProps {
  environment: string;
  vpc: Vpc;
  ec2InstanceSecurityGroup: SecurityGroup;
}

export class RdsSecurityGroup extends Construct {
  public readonly securityGroup: SecurityGroup;
  private readonly PORT: number = 3306;

  constructor(scope: Construct, props: RdsSecurityGroupProps) {
    super(scope, `RDS-SG-${props.environment}`);

    this.securityGroup = new SecurityGroup(this, `SG-${props.environment}`, {
      vpc: props.vpc,
      description: "Allow access from EC2 Instance",
    });

    this.securityGroup.addIngressRule(
      props.ec2InstanceSecurityGroup,
      Port.tcp(this.PORT),
      `Allow MySQL access from EC2 (port ${this.PORT})`,
    );
  }
}
