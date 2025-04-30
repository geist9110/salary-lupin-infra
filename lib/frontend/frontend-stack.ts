import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { FrontendCodeBuild } from "./FrontendCodeBuild";
import { FrontendBucket } from "./FrontendBucket";
import { FrontendCodePipeline } from "./FrontendCodePipeline";

interface FrontendStackProps extends StackProps {
  appName: string;
  environment: string;
  githubOwner: string;
  githubFrontendRepo: string;
  githubConnectionArn: string;
  githubBranch: string;
}

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const buckets = new FrontendBucket(this, "Bucket", {
      appName: props.appName,
      environment: props.environment,
    });

    const codeBuild = new FrontendCodeBuild(
      this,
      "CodeBuild",
      props.environment,
    );

    new FrontendCodePipeline(this, "Pipeline", {
      env: props.environment,
      githubOwner: props.githubOwner,
      githubRepo: props.githubFrontendRepo,
      githubBranch: props.githubBranch,
      githubConnectionArn: props.githubConnectionArn,
      buildProject: codeBuild.build,
      targetBucket: buckets.frontendBucket,
      artifactBucket: buckets.pipelineArtifactBucket,
    });
  }
}
