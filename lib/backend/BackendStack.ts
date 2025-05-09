import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  ContainerImage,
  Ec2Service,
  Ec2TaskDefinition,
  Protocol,
} from "aws-cdk-lib/aws-ecs";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { BackendSecurityGroup } from "./BackendSecurityGroup";
import { BackendEcsInfra } from "./BackendEcsInfra";

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

    const backendEcsInfra = new BackendEcsInfra(this, `BackendEcsInfra`, {
      environment: props.environment,
      vpc: props.vpc,
      securityGroup: securityGroup.securityGroup,
    });

    const taskDefinition = new Ec2TaskDefinition(
      this,
      `Backend-TaskDef-${props.environment}`,
    );

    taskDefinition.addContainer(`Backend-Task-Container`, {
      image: ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
      portMappings: [
        {
          containerPort: 80,
          hostPort: 80,
          protocol: Protocol.TCP,
        },
      ],
    });

    new Ec2Service(this, `Backend-Service-${props.environment}`, {
      cluster: backendEcsInfra.cluster,
      taskDefinition: taskDefinition,
    });
  }
}
