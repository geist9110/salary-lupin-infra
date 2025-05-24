import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { LoadBalancerSecurityGroup } from "./LoadBalancerSecurityGroup";
import { EC2InstanceSecurityGroup } from "./EC2InstanceSecurityGroup";
import { RdsSecurityGroup } from "./RdsSecurityGroup";

interface SecurityGroupStackProps extends StackProps {
  environment: string;
  appName: string;
  vpc: Vpc;
}

export class SecurityGroupStack extends Stack {
  public readonly loadBalancer: SecurityGroup;
  public readonly ec2: SecurityGroup;
  public readonly rds: SecurityGroup;

  constructor(scope: Construct, props: SecurityGroupStackProps) {
    super(scope, `${props.appName}-SG-Stack-${props.environment}`, props);

    this.loadBalancer = new LoadBalancerSecurityGroup(this, {
      environment: props.environment,
      vpc: props.vpc,
    }).securityGroup;

    this.ec2 = new EC2InstanceSecurityGroup(this, {
      environment: props.environment,
      vpc: props.vpc,
      loadBalancerSecurityGroup: this.loadBalancer,
    }).securityGroup;

    this.rds = new RdsSecurityGroup(this, {
      environment: props.environment,
      vpc: props.vpc,
      ec2InstanceSecurityGroup: this.ec2,
    }).securityGroup;
  }
}
