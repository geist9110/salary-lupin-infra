import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codebuild from "aws-cdk-lib/aws-codebuild";

interface FrontendCodePipelineProps {
  env: string;
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
      pipelineName: `frontend-pipeline-${props.env}`,
      artifactBucket: props.artifactBucket,
    });

    this.pipeline.addStage({
      stageName: "Source",
      actions: [
        new codepipeline_actions.CodeStarConnectionsSourceAction({
          actionName: "Github_Source",
          owner: props.githubOwner,
          repo: props.githubRepo,
          branch: props.githubBranch,
          connectionArn: props.githubConnectionArn,
          output: sourceOutput,
        }),
      ],
    });

    this.pipeline.addStage({
      stageName: "Build",
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: "Build_Frontend",
          input: sourceOutput,
          outputs: [buildOutput],
          project: props.buildProject,
        }),
      ],
    });

    this.pipeline.addStage({
      stageName: "Deploy",
      actions: [
        new codepipeline_actions.S3DeployAction({
          actionName: "DeployToS3",
          input: buildOutput,
          bucket: props.targetBucket,
        }),
      ],
    });
  }
}
