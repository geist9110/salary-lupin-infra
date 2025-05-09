import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Ec2Service } from "aws-cdk-lib/aws-ecs";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { BackendSecurityGroup } from "./BackendSecurityGroup";
import { BackendEcsInfra } from "./BackendEcsInfra";
import { BackendEcsTask } from "./BackendEcsTask";

interface BackendStackProps {
  environment: string;
  vpc: Vpc;
}

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id);

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
        securityGroup: securityGroup.securityGroup,
      },
    );

    const ecsTask = new BackendEcsTask(
      this,
      `Backend-ECS-Task-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    new Ec2Service(this, `Backend-Service-${props.environment}`, {
      cluster: ecsInfra.cluster,
      taskDefinition: ecsTask.taskDefinition,
    });
  }
}
