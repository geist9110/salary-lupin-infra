import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Ec2Service } from "aws-cdk-lib/aws-ecs";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { BackendSecurityGroup } from "./BackendSecurityGroup";
import { BackendEcsInfra } from "./BackendEcsInfra";
import { BackendEcsTask } from "./BackendEcsTask";
import { BackendLoadBalancer } from "./BackendLoadBalancer";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

interface BackendStackProps extends StackProps {
  environment: string;
  vpc: Vpc;
  domainName: string;
  certificate: Certificate;
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

    const ecsInfra = new BackendEcsInfra(
      this,
      `Backend-ECS-Infra-${props.environment}`,
      {
        environment: props.environment,
        vpc: props.vpc,
        securityGroup: securityGroup.ecsSecurityGroup,
      },
    );

    const ecsTask = new BackendEcsTask(
      this,
      `Backend-ECS-Task-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    const ecsService = new Ec2Service(
      this,
      `Backend-Service-${props.environment}`,
      {
        cluster: ecsInfra.cluster,
        taskDefinition: ecsTask.taskDefinition,
      },
    );

    const loadBalancer = new BackendLoadBalancer(
      this,
      `Backend-LoadBalancer-${props.environment}`,
      {
        environment: props.environment,
        vpc: props.vpc,
        securityGroup: securityGroup.loadBalancerSecurityGroup,
        target: ecsService,
        certificate: props.certificate,
      },
    );

    const hostedZone = HostedZone.fromLookup(
      this,
      `HostedZone-${props.environment}`,
      {
        domainName: props.domainName,
      },
    );

    new ARecord(this, `Backend-record-${props.environment}`, {
      zone: hostedZone,
      recordName: `api${props.environment == "prod" ? "" : "." + props.environment}`,
      target: RecordTarget.fromAlias(
        new LoadBalancerTarget(loadBalancer.applicationLoadBalancer),
      ),
    });
  }
}
