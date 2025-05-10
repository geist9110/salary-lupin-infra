import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Repository } from "aws-cdk-lib/aws-ecr";

interface EcrStackProps extends StackProps {
  environment: string;
}

export class EcrStack extends Stack {
  public readonly repository: Repository;

  constructor(scope: Construct, id: string, props: EcrStackProps) {
    super(scope, id, props);

    this.repository = new Repository(
      this,
      `ecr-repository-${props.environment}`,
      { removalPolicy: RemovalPolicy.DESTROY },
    );
  }
}
