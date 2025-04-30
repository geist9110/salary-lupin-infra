import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { FrontendCodeBuild } from "./FrontendCodeBuild";
import { FrontendBucket } from "./FrontendBucket";

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const env = process.env.NODE_ENV ?? "dev";

    const buckets = new FrontendBucket(this, "Bucket", env);
    const codeBuild = new FrontendCodeBuild(this, "CodeBuild", env);
  }
}
