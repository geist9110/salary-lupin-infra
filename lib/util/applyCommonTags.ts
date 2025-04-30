import { Construct } from "constructs";
import { Tags } from "aws-cdk-lib";

interface TagProps {
  resources: Construct[];
  appName: string;
  environment: string;
}

export function applyCommonTags({ resources, appName, environment }: TagProps) {
  for (const resource of resources) {
    Tags.of(resource).add("Application", appName);
    Tags.of(resource).add("Environment", environment);
  }
}
