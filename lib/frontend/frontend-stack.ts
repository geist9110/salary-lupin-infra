import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { FrontendCodeBuild } from "./FrontendCodeBuild";
import { FrontendBucket } from "./FrontendBucket";
import { FrontendCodePipeline } from "./FrontendCodePipeline";

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const env = process.env.NODE_ENV ?? "dev";
    const githubOwner = process.env.GITHUB_OWNER;
    const githubFrontendRepo = process.env.GITHUB_REPO_FRONTEND;
    const githubConnectionArn = process.env.GITHUB_CONNECTION_ARN;
    const githubBranch = process.env.BRANCH;

    if (!githubOwner) throw new Error("GITHUB_OWNER Not Found");
    if (!githubFrontendRepo) throw new Error("GITHUB_REPO_FRONTEND Not Found");
    if (!githubConnectionArn)
      throw new Error("GITHUB_CONNECTION_ARN Not Found");
    if (!githubBranch) throw new Error("BRANCH Not Found");

    const buckets = new FrontendBucket(this, "Bucket", env);
    const codeBuild = new FrontendCodeBuild(this, "CodeBuild", env);
    const codePipeline = new FrontendCodePipeline(this, "Pipeline", {
      env: env,
      githubOwner: githubOwner,
      githubRepo: githubFrontendRepo,
      githubBranch: githubBranch,
      githubConnectionArn: githubConnectionArn,
      buildProject: codeBuild.build,
      targetBucket: buckets.frontendBucket,
    });
  }
}
