import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  StorageType,
} from "aws-cdk-lib/aws-rds";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

interface RdsStackProps extends StackProps {
  environment: string;
  appName: string;
  vpc: Vpc;
  rdsUserName: string;
  securityGroup: SecurityGroup;
}

export class RdsStack extends Stack {
  public readonly dbSecret: ISecret;
  public readonly dbUrl: string;
  public readonly dbPort: string;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    const DB = new DatabaseInstance(
      this,
      `${props.appName}-Backend-DB-${props.environment}`,
      {
        engine: DatabaseInstanceEngine.MYSQL,
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        }),
        publiclyAccessible: false,
        multiAz: false,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: StorageType.GP2,
        databaseName: `${props.appName}`,
        credentials: Credentials.fromGeneratedSecret(props.rdsUserName),
        removalPolicy: RemovalPolicy.DESTROY,
        deletionProtection: false,
        securityGroups: [props.securityGroup],
      },
    );

    this.dbSecret = DB.secret!;
    this.dbUrl = DB.dbInstanceEndpointAddress;
    this.dbPort = DB.dbInstanceEndpointPort;

    new StringParameter(
      this,
      `${props.appName}-DB-Url-Param-${props.environment}`,
      {
        parameterName: `/${props.appName}/${props.environment}/DB_URL`,
        stringValue: `jdbc:mysql://${this.dbUrl}:${this.dbPort}/${props.appName}`,
      },
    );

    new StringParameter(
      this,
      `${props.appName}-DB-SecretArn-Param-${props.environment}`,
      {
        parameterName: `/${props.appName}/${props.environment}/DB_SECRET_ARN`,
        stringValue: this.dbSecret.secretArn,
      },
    );
  }
}
