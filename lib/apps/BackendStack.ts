import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { EC2InstanceRole } from "../iam/EC2InstanceRole";
import { BackendPipeline } from "../cicd/BackendPipeline";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { GithubConfig } from "../common/GithubConfig";
import { HttpLoadBalancer } from "../compute/HttpLoadBalancer";
import { EC2AutoScalingGroup } from "../compute/EC2AutoScalingGroup";
import { AliasRecord } from "../dns/AliasRecord";

interface BackendStackProps extends StackProps {
  environment: string;
  appName: string;
  vpc: Vpc;
  certificate: Certificate;
  hostedZone: IHostedZone;
  loadBalancerSecurityGroup: SecurityGroup;
  ec2SecurityGroup: SecurityGroup;
  rdsSecret: ISecret;
  rdsUrl: string;
  rdsPort: string;
  github: GithubConfig;
}

export class BackendStack extends Stack {
  constructor(scope: Construct, props: BackendStackProps) {
    super(scope, `${props.appName}-Backend-Stack-${props.environment}`, props);

    const instanceRole = new EC2InstanceRole(this, {
      environment: props.environment,
    }).role;

    const autoScalingGroup = new EC2AutoScalingGroup(this, {
      environment: props.environment,
      vpc: props.vpc,
      securityGroup: props.ec2SecurityGroup,
      role: instanceRole,
    }).autoScalingGroup;

    const loadBalancer = new HttpLoadBalancer(this, {
      environment: props.environment,
      vpc: props.vpc,
      securityGroup: props.loadBalancerSecurityGroup,
      certificate: props.certificate,
      autoScalingGroup: autoScalingGroup,
    }).loadBalancer;

    new BackendPipeline(this, {
      environment: props.environment,
      appName: props.appName,
      autoScalingGroup: autoScalingGroup,
      rdsSecret: props.rdsSecret,
      rdsUrl: props.rdsUrl,
      rdsPort: props.rdsPort,
      github: props.github,
    });

    new AliasRecord(this, {
      environment: props.environment,
      hostedZone: props.hostedZone,
      subDomain: "api",
      recordTarget: new LoadBalancerTarget(loadBalancer),
    });
  }
}
