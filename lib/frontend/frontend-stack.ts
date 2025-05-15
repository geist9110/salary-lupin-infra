import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { FrontendCodeBuild } from "./FrontendCodeBuild";
import { FrontendCodePipeline } from "./FrontendCodePipeline";
import { WebBucket } from "../storage/WebBucket";
import { ArtifactBucket } from "../storage/ArtifactBucket";
import { SPACloudFront } from "../cdn/SPACloudFront";
import { GithubConfig } from "../common/GithubConfig";

interface FrontendStackProps extends StackProps {
  appName: string;
  environment: string;
  github: GithubConfig;
  certificateArn: string;
  hostedZoneId: string;
  hostedZoneName: string;
}

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const webBucket = new WebBucket(this, {
      environment: props.environment,
    }).bucket;

    const artifactBucket = new ArtifactBucket(this, {
      environment: props.environment,
    }).bucket;

    const codeBuild = new FrontendCodeBuild(this, "CodeBuild", {
      environment: props.environment,
      artifactBucket: artifactBucket,
    });

    const codePipeline = new FrontendCodePipeline(this, "Pipeline", {
      environment: props.environment,
      github: props.github,
      buildProject: codeBuild.build,
      targetBucket: webBucket,
      artifactBucket: artifactBucket,
    });

    const cloudfront = new SPACloudFront(this, {
      environment: props.environment,
      bucket: webBucket,
      certificateArn: props.certificateArn,
      hostedZoneId: props.hostedZoneId,
      hostedZoneName: props.hostedZoneName,
    });
  }
}
