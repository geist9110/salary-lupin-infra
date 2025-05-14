import { Construct } from "constructs";
import { Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { LoadBalancerSecurityGroup } from "../securityGroup/LoadBalancerSecurityGroup";

interface BackendSecurityGroupProps {
  environment: string;
  vpc: Vpc;
}

export class BackendSecurityGroup extends Construct {
  public readonly loadBalancerSecurityGroup: SecurityGroup;
  public readonly ec2SecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: BackendSecurityGroupProps) {
    super(scope, id);

    this.loadBalancerSecurityGroup = new LoadBalancerSecurityGroup(this, {
      environment: props.environment,
      vpc: props.vpc,
    }).securityGroup;

    this.ec2SecurityGroup = new SecurityGroup(
      this,
      `Backend-ECS-SecurityGroup-${props.environment}`,
      {
        vpc: props.vpc,
        allowAllOutbound: true,
        description: "Allow HTTP from LoadBalancer",
      },
    );

    this.ec2SecurityGroup.addIngressRule(
      this.loadBalancerSecurityGroup,
      Port.tcp(8080),
      "Allow HTTP from Loadbalancer",
    );
  }
}
