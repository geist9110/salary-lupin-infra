import { Construct } from "constructs";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { getRecordName } from "../util/domainUtil";

interface FrontendCodeBuildProps {
  environment: string;
  artifactBucket: Bucket;
  domainName: string;
}

export class FrontendCodeBuild extends Construct {
  public readonly project: PipelineProject;

  constructor(scope: Construct, props: FrontendCodeBuildProps) {
    super(scope, `CodeBuild-${props.environment}`);

    this.project = new PipelineProject(this, `Project-${props.environment}`, {
      projectName: `Frontend-Project-${props.environment}`,
      environment: {
        buildImage: LinuxBuildImage.STANDARD_7_0,
        environmentVariables: {
          NODE_ENV: { value: props.environment },
          VITE_API_BASE_URL: {
            value: `${getRecordName("api", props.environment)}.${props.domainName}`,
          },
        },
      },
      buildSpec: BuildSpec.fromSourceFilename("buildspec.yaml"),
    });
  }
}
