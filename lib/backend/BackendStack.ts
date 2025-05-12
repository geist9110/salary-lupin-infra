import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Instance,
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

interface BackendStackProps extends StackProps {
  environment: string;
  vpc: Vpc;
  certificate: Certificate;
  hostedZone: IHostedZone;
}

export class BackendStack extends Stack {
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

    const ec2Instance = new Instance(
      this,
      `BackendInstance-${props.environment}`,
      {
        vpc: props.vpc,
        instanceType: new InstanceType("t3.micro"),
        machineImage: MachineImage.latestAmazonLinux2(),
        securityGroup: securityGroup.ec2SecurityGroup,
        vpcSubnets: {
          subnetType: SubnetType.PUBLIC,
        },
      },
    );

    const loadBalancer = new BackendLoadBalancer(
      this,
      `Backend-LoadBalancer-${props.environment}`,
      {
        environment: props.environment,
        vpc: props.vpc,
        securityGroup: securityGroup.loadBalancerSecurityGroup,
        target: ec2Instance,
        certificate: props.certificate,
      },
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
