import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Instance,
  InstanceType,
  MachineImage,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { BackendSecurityGroup } from "./BackendSecurityGroup";
import { BackendLoadBalancer } from "./BackendLoadBalancer";
import { ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
  BuildEnvironmentVariableType,
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import {
  CodeBuildAction,
  CodeStarConnectionsSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";

interface BackendStackProps extends StackProps {
  environment: string;
  appName: string;
  vpc: Vpc;
  certificate: Certificate;
  hostedZone: IHostedZone;
  rdsSecret: ISecret;
  rdsUrl: string;
  rdsPort: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubConnectionArn: string;
}

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const securityGroup = new BackendSecurityGroup(
      this,
      `Backend-SecurityGroup-${props.environment}`,
      {
        environment: props.environment,
        vpc: props.vpc,
      },
    );

    const ec2Instance = new Instance(
      this,
      `BackendInstance-${props.environment}`,
      {
        vpc: props.vpc,
        instanceType: new InstanceType("t3.micro"),
        machineImage: MachineImage.latestAmazonLinux2(),
        securityGroup: securityGroup.ec2SecurityGroup,
        vpcSubnets: {
          subnetType: SubnetType.PUBLIC,
        },
      },
    );

    const loadBalancer = new BackendLoadBalancer(
      this,
      `Backend-LoadBalancer-${props.environment}`,
      {
        environment: props.environment,
        vpc: props.vpc,
        securityGroup: securityGroup.loadBalancerSecurityGroup,
        target: ec2Instance,
        certificate: props.certificate,
      },
    );

    new ARecord(this, `Backend-record-${props.environment}`, {
      zone: props.hostedZone,
      recordName: `api${props.environment == "prod" ? "" : "." + props.environment}`,
      target: RecordTarget.fromAlias(
        new LoadBalancerTarget(loadBalancer.applicationLoadBalancer),
      ),
    });

    const artifactBucket = new Bucket(
      this,
      `Backend-ArtifactBucket-${props.environment}`,
      {
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      },
    );

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
        artifactBucket: artifactBucket,
        pipelineName: `Backend-Pipeline-${props.environment}`,
      },
    );

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new CodeStarConnectionsSourceAction({
          actionName: "Github_Source",
          owner: props.githubOwner,
          repo: props.githubRepo,
          branch: props.githubBranch,
          connectionArn: props.githubConnectionArn,
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
  }
}
