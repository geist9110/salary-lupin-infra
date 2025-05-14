import { Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { BackendSecurityGroup } from "./BackendSecurityGroup";
import { BackendLoadBalancer } from "./BackendLoadBalancer";
import { ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
import {
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";

interface BackendStackProps extends StackProps {
  environment: string;
  appName: string;
  vpc: Vpc;
  certificate: Certificate;
  hostedZone: IHostedZone;
}

export class BackendStack extends Stack {
  public readonly autoScalingGroup: AutoScalingGroup;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const securityGroup = new BackendSecurityGroup(
      this,
      `Backend-SecurityGroup-${props.environment}`,
      {
        environment: props.environment,
        vpc: props.vpc,
      },
    );

    const instanceRole = new Role(
      this,
      `BackendInstanceRole-${props.environment}`,
      {
        assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
        description: "Role for EC2 instances in the backend ASG",
      },
    );

    instanceRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
    );

    instanceRole.addToPolicy(
      new PolicyStatement({
        actions: [
          "ssm:GetParameter",
          "secretsmanager:GetSecretValue",
          "ec2:DescribeTags",
        ],
        resources: ["*"],
      }),
    );

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
        securityGroup: securityGroup.ec2SecurityGroup,
        role: instanceRole,
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
        securityGroup: securityGroup.loadBalancerSecurityGroup,
        certificate: props.certificate,
      },
    );

    this.autoScalingGroup.attachToApplicationTargetGroup(
      loadBalancer.targetGroup,
    );

    new ARecord(this, `Backend-record-${props.environment}`, {
      zone: props.hostedZone,
      recordName: `api${props.environment == "prod" ? "" : "." + props.environment}`,
      target: RecordTarget.fromAlias(
        new LoadBalancerTarget(loadBalancer.applicationLoadBalancer),
      ),
    });
  }
}
