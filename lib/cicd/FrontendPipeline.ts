import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
  CodeBuildAction,
  CodeStarConnectionsSourceAction,
  S3DeployAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import { PipelineProject } from "aws-cdk-lib/aws-codebuild";
import { GithubConfig } from "../common/GithubConfig";

interface FrontendPipelineProps {
  environment: string;
  github: GithubConfig;
  buildProject: PipelineProject;
  targetBucket: Bucket;
  artifactBucket: Bucket;
}

export class FrontendPipeline extends Construct {
  private readonly pipeline: Pipeline;

  constructor(scope: Construct, props: FrontendPipelineProps) {
    super(scope, `Frontend-Pipeline-${props.environment}`);

    const sourceOutput = new Artifact();
    const buildOutput = new Artifact();

    this.pipeline = new Pipeline(this, `Pipeline-${props.environment}`, {
      pipelineName: `Backend-Pipeline-${props.environment}`,
      artifactBucket: props.artifactBucket,
    });

    this.addSourceStage(props.github, sourceOutput);
    this.addBuildStage(props.buildProject, sourceOutput, buildOutput);
    this.addDeployStage(props.targetBucket, buildOutput);
  }

  private addSourceStage(github: GithubConfig, output: Artifact) {
    this.pipeline.addStage({
      stageName: "Source",
      actions: [
        new CodeStarConnectionsSourceAction({
          actionName: "Github_Source",
          owner: github.owner,
          repo: github.repository,
          branch: github.branch,
          connectionArn: github.connectionArn,
          output: output,
        }),
      ],
    });
  }

  private addBuildStage(
    project: PipelineProject,
    input: Artifact,
    output: Artifact,
  ) {
    this.pipeline.addStage({
      stageName: "Build",
      actions: [
        new CodeBuildAction({
          actionName: "Build_Frontend",
          input,
          outputs: [output],
          project: project,
        }),
      ],
    });
  }

  private addDeployStage(targetBucket: Bucket, input: Artifact) {
    this.pipeline.addStage({
      stageName: "Deploy",
      actions: [
        new S3DeployAction({
          actionName: "DeployToS3",
          input,
          bucket: targetBucket,
        }),
      ],
    });
  }
}
