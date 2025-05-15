export function getRecordName(subDomain: string, environment: string): string {
  return `${subDomain}${isProduction(environment) ? "" : "." + environment}`;
}

export function isProduction(environment: string): boolean {
  return environment == "prod";
}
