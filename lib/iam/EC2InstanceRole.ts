import { Construct } from "constructs";
import {
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";

interface InstanceRoleProps {
  environment: string;
}

export class EC2InstanceRole extends Construct {
  public readonly role: Role;

  constructor(scope: Construct, props: InstanceRoleProps) {
    super(scope, `EC2-Instance-Role-${props.environment}`);

    this.role = new Role(this, `Role-${props.environment}`, {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
      description: "Role for EC2 instances in the backend ASG",
    });

    this.role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
    );

    this.role.addToPolicy(
      new PolicyStatement({
        actions: [
          "ssm:GetParameter",
          "secretsmanager:GetSecretValue",
          "ec2:DescribeTags",
        ],
        resources: ["*"],
      }),
    );
  }
}
