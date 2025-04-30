import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import { Tags } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

interface FrontendCodeBuildProps {
  appName: string;
  environment: string;
  artifactBucket: s3.Bucket;
}

export class FrontendCodeBuild extends Construct {
  public readonly role: iam.Role;
  public readonly build: codebuild.PipelineProject;

  constructor(scope: Construct, id: string, props: FrontendCodeBuildProps) {
    super(scope, id);

    this.role = new iam.Role(this, "CodeBuildRole", {
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["s3:GetObject", "s3:PutObject"],
              resources: [`${props.artifactBucket.bucketArn}/*`],
            }),
          ],
        }),
      },
    });

    this.build = new codebuild.PipelineProject(this, "BuildProject", {
      projectName: `frontend-codebuild-${props.environment}`,
      role: this.role,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        environmentVariables: {
          NODE_ENV: { value: props.environment },
        },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yaml"),
    });

    for (const product of [this.role, this.build]) {
      Tags.of(product).add("Application", props.appName);
      Tags.of(product).add("Environment", props.environment);
    }
  }
}
