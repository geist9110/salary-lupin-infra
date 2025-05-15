import { Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { BackendLoadBalancer } from "./BackendLoadBalancer";
import { ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
import { EC2InstanceRole } from "../iam/EC2InstanceRole";
import { BackendPipeline } from "../cicd/BackendPipeline";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { GithubConfig } from "../common/GithubConfig";

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
  public readonly autoScalingGroup: AutoScalingGroup;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const instanceRole = new EC2InstanceRole(this, {
      environment: props.environment,
    });

    this.autoScalingGroup = new AutoScalingGroup(
      this,
      `Backend-ASG-${props.environment}`,
      {
        vpc: props.vpc,
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
        machineImage: MachineImage.latestAmazonLinux2023(),
        minCapacity: 0,
        maxCapacity: 2,
        desiredCapacity: 1,
        vpcSubnets: { subnetType: SubnetType.PUBLIC },
        securityGroup: props.ec2SecurityGroup,
        role: instanceRole.role,
      },
    );

    Tags.of(this.autoScalingGroup).add("env", props.environment, {
      applyToLaunchedInstances: true,
    });

    const loadBalancer = new BackendLoadBalancer(
      this,
      `Backend-LoadBalancer-${props.environment}`,
      {
        environment: props.environment,
        vpc: props.vpc,
        securityGroup: props.loadBalancerSecurityGroup,
        certificate: props.certificate,
      },
    );

    this.autoScalingGroup.attachToApplicationTargetGroup(
      loadBalancer.targetGroup,
    );

    new BackendPipeline(this, {
      environment: props.environment,
      appName: props.appName,
      autoScalingGroup: this.autoScalingGroup,
      rdsSecret: props.rdsSecret,
      rdsUrl: props.rdsUrl,
      rdsPort: props.rdsPort,
      github: props.github,
    });

    new ARecord(this, `Backend-record-${props.environment}`, {
      zone: props.hostedZone,
      recordName: `api${props.environment == "prod" ? "" : "." + props.environment}`,
      target: RecordTarget.fromAlias(
        new LoadBalancerTarget(loadBalancer.applicationLoadBalancer),
      ),
    });
  }
}
