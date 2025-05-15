import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { FrontendCodeBuild } from "../cicd/FrontendCodeBuild";
import { FrontendPipeline } from "../cicd/FrontendPipeline";
import { WebBucket } from "../storage/WebBucket";
import { ArtifactBucket } from "../storage/ArtifactBucket";
import { SPACloudFront } from "../cdn/SPACloudFront";
import { GithubConfig } from "../common/GithubConfig";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { AliasRecord } from "../dns/AliasRecord";

interface FrontendStackProps extends StackProps {
  appName: string;
  environment: string;
  github: GithubConfig;
  certificateArn: string;
  hostedZoneId: string;
  hostedZoneName: string;
}

export class FrontendStack extends Stack {
  constructor(scope: Construct, props: FrontendStackProps) {
    super(scope, `${props.appName}-Frontend-Stack-${props.environment}`, props);

    const webBucket = new WebBucket(this, {
      environment: props.environment,
    }).bucket;

    const artifactBucket = new ArtifactBucket(this, {
      environment: props.environment,
    }).bucket;

    const project = new FrontendCodeBuild(this, {
      environment: props.environment,
      artifactBucket: artifactBucket,
    }).project;

    const codePipeline = new FrontendPipeline(this, {
      environment: props.environment,
      github: props.github,
      buildProject: project,
      targetBucket: webBucket,
      artifactBucket: artifactBucket,
    });

    const hostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      `HostedZone-${props.environment}`,
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.hostedZoneName,
      },
    );

    const distribution = new SPACloudFront(this, {
      environment: props.environment,
      bucket: webBucket,
      certificateArn: props.certificateArn,
      hostedZone: hostedZone,
    }).distribution;

    new AliasRecord(this, {
      environment: props.environment,
      subDomain: "www",
      hostedZone: hostedZone,
      recordTarget: new CloudFrontTarget(distribution),
    });
  }
}
