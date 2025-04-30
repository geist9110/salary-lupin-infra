import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codebuild from "aws-cdk-lib/aws-codebuild";

interface FrontendCodePipelineProps {
  environment: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubConnectionArn: string;
  buildProject: codebuild.PipelineProject;
  targetBucket: s3.Bucket;
  artifactBucket: s3.Bucket;
}

export class FrontendCodePipeline extends Construct {
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: FrontendCodePipelineProps) {
    super(scope, id);

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    this.pipeline = new codepipeline.Pipeline(this, "FrontendPipeline", {
      pipelineName: `frontend-pipeline-${props.environment}`,
      artifactBucket: props.artifactBucket,
    });

    this.addSourceStage(props, sourceOutput);
    this.addBuildStage(props, sourceOutput, buildOutput);
    this.addDeployStage(props, buildOutput);
  }

  private addSourceStage(
    props: FrontendCodePipelineProps,
    output: codepipeline.Artifact,
  ) {
    this.pipeline.addStage({
      stageName: "Source",
      actions: [
        new codepipeline_actions.CodeStarConnectionsSourceAction({
          actionName: "Github_Source",
          owner: props.githubOwner,
          repo: props.githubRepo,
          branch: props.githubBranch,
          connectionArn: props.githubConnectionArn,
          output: output,
        }),
      ],
    });
  }

  private addBuildStage(
    props: FrontendCodePipelineProps,
    input: codepipeline.Artifact,
    output: codepipeline.Artifact,
  ) {
    this.pipeline.addStage({
      stageName: "Build",
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: "Build_Frontend",
          input,
          outputs: [output],
          project: props.buildProject,
        }),
      ],
    });
  }

  private addDeployStage(
    props: FrontendCodePipelineProps,
    input: codepipeline.Artifact,
  ) {
    this.pipeline.addStage({
      stageName: "Deploy",
      actions: [
        new codepipeline_actions.S3DeployAction({
          actionName: "DeployToS3",
          input,
          bucket: props.targetBucket,
        }),
      ],
    });
  }
}
