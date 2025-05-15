import { Construct } from "constructs";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
  BuildEnvironmentVariableType,
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import {
  CodeBuildAction,
  CodeDeployServerDeployAction,
  CodeStarConnectionsSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
  ServerApplication,
  ServerDeploymentConfig,
  ServerDeploymentGroup,
} from "aws-cdk-lib/aws-codedeploy";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
import { ArtifactBucket } from "../storage/ArtifactBucket";
import { GithubConfig } from "../common/GithubConfig";

interface BackendPipelineProps {
  environment: string;
  appName: string;
  rdsSecret: ISecret;
  rdsUrl: string;
  rdsPort: string;
  github: GithubConfig;
  autoScalingGroup: AutoScalingGroup;
}

export class BackendPipeline extends Construct {
  constructor(scope: Construct, props: BackendPipelineProps) {
    super(scope, `Pipeline-${props.environment}`);

    const artifactBucket = new ArtifactBucket(this, {
      environment: props.environment,
    });

    const sourceOutput = new Artifact();
    const buildOutput = new Artifact();

    const project = new PipelineProject(
      this,
      `BackendBuildProject-${props.environment}`,
      {
        buildSpec: BuildSpec.fromSourceFilename("buildspec.yml"),
        environment: {
          buildImage: LinuxBuildImage.STANDARD_7_0,
        },
        environmentVariables: {
          RDS_USERNAME: {
            value: `${props.rdsSecret.secretArn}:username`,
            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
          },
          RDS_PASSWORD: {
            value: `${props.rdsSecret.secretArn}:password`,
            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
          },
          RDS_URL: {
            value: `jdbc:mysql://${props.rdsUrl}:${props.rdsPort}/${props.appName}`,
            type: BuildEnvironmentVariableType.PLAINTEXT,
          },
        },
      },
    );

    const pipeline = new Pipeline(
      this,
      `BackendPipeline-${props.environment}`,
      {
        artifactBucket: artifactBucket.bucket,
        pipelineName: `Backend-Pipeline-${props.environment}`,
      },
    );

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new CodeStarConnectionsSourceAction({
          actionName: "Github_Source",
          owner: props.github.owner,
          repo: props.github.repository,
          branch: props.github.branch,
          connectionArn: props.github.connectionArn,
          output: sourceOutput,
        }),
      ],
    });

    pipeline.addStage({
      stageName: "Build",
      actions: [
        new CodeBuildAction({
          actionName: "CodeBuild",
          project: project,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    const deploymentGroup = new ServerDeploymentGroup(
      this,
      `BackendDeploymentGroup-${props.environment}`,
      {
        application: new ServerApplication(
          this,
          `BackendCodeDeployApp-${props.environment}`,
        ),
        autoScalingGroups: [props.autoScalingGroup],
        deploymentGroupName: `Backend-Deployment-Group-${props.environment}`,
        installAgent: true,
        deploymentConfig: ServerDeploymentConfig.ALL_AT_ONCE,
      },
    );

    pipeline.addStage({
      stageName: "Deploy",
      actions: [
        new CodeDeployServerDeployAction({
          actionName: "DeployToEC2",
          input: buildOutput,
          deploymentGroup: deploymentGroup,
        }),
      ],
    });
  }
}
