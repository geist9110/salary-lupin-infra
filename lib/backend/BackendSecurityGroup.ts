import { Construct } from "constructs";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { LoadBalancerSecurityGroup } from "../securityGroup/LoadBalancerSecurityGroup";
import { EC2InstanceSecurityGroup } from "../securityGroup/EC2InstanceSecurityGroup";

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

    this.ec2SecurityGroup = new EC2InstanceSecurityGroup(this, {
      environment: props.environment,
      vpc: props.vpc,
      loadBalancerSecurityGroup: this.loadBalancerSecurityGroup,
    }).securityGroup;
  }
}
