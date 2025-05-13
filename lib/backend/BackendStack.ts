import { RemovalPolicy, Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  InstanceClass,
  InstanceSize,
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
  CodeDeployServerDeployAction,
  CodeStarConnectionsSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
  ServerApplication,
  ServerDeploymentConfig,
  ServerDeploymentGroup,
} from "aws-cdk-lib/aws-codedeploy";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
import {
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";

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

    const instanceRole = new Role(
      this,
      `BackendInstanceRole-${props.environment}`,
      {
        assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
        description: "Role for EC2 instances in the backend ASG",
      },
    );

    instanceRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
    );

    instanceRole.addToPolicy(
      new PolicyStatement({
        actions: [
          "ssm:GetParameter",
          "secretsmanager:GetSecretValue",
          "ec2:DescribeTags",
        ],
        resources: ["*"],
      }),
    );

    const autoScalingGroup = new AutoScalingGroup(
      this,
      `Backend-ASG-${props.environment}`,
      {
        vpc: props.vpc,
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
        machineImage: MachineImage.latestAmazonLinux2023(),
        minCapacity: 0,
        maxCapacity: 2,
        desiredCapacity: 1,
        vpcSubnets: { subnetType: SubnetType.PUBLIC },
        securityGroup: securityGroup.ec2SecurityGroup,
        role: instanceRole,
      },
    );

    Tags.of(autoScalingGroup).add("env", props.environment, {
      applyToLaunchedInstances: true,
    });

    const loadBalancer = new BackendLoadBalancer(
      this,
      `Backend-LoadBalancer-${props.environment}`,
      {
        environment: props.environment,
        vpc: props.vpc,
        securityGroup: securityGroup.loadBalancerSecurityGroup,
        certificate: props.certificate,
      },
    );

    autoScalingGroup.attachToApplicationTargetGroup(loadBalancer.targetGroup);

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

    const deploymentGroup = new ServerDeploymentGroup(
      this,
      `BackendDeploymentGroup-${props.environment}`,
      {
        application: new ServerApplication(
          this,
          `BackendCodeDeployApp-${props.environment}`,
        ),
        autoScalingGroups: [autoScalingGroup],
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
          deploymentGroup,
        }),
      ],
    });
  }
}
