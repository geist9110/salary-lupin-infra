import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as codebuild from "aws-cdk-lib/aws-codebuild";

export class FrontendCodeBuild extends Construct {
  public readonly role: iam.Role;
  public readonly build: codebuild.PipelineProject;

  constructor(scope: Construct, id: string, env: string) {
    super(scope, id);

    this.role = new iam.Role(this, "CodeBuildRole", {
      roleName: `frontend-codebuild-role-${env}`,
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
      ],
    });

    this.build = new codebuild.PipelineProject(this, "BuildProject", {
      projectName: `frontend-codebuild-${env}`,
      role: this.role,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        environmentVariables: {
          NODE_ENV: { value: env },
        },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
    });
  }
}
