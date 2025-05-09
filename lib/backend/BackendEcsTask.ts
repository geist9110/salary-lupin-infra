import { Construct } from "constructs";
import {
  ContainerImage,
  Ec2TaskDefinition,
  Protocol,
} from "aws-cdk-lib/aws-ecs";

export class BackendEcsTask extends Construct {
  public readonly taskDefinition: Ec2TaskDefinition;

  constructor(scope: Construct, id: string, props: { environment: string }) {
    super(scope, id);

    this.taskDefinition = new Ec2TaskDefinition(
      this,
      `Backend-TaskDef-${props.environment}`,
    );

    this.taskDefinition.addContainer(`Backend-Task-Container`, {
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
  }
}
