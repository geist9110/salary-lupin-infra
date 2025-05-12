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
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

interface RdsStackProps extends StackProps {
  environment: string;
  appName: string;
  vpc: Vpc;
  rdsUserName: string;
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
      },
    );

    this.dbSecret = DB.secret!;
    this.dbUrl = DB.dbInstanceEndpointAddress;
    this.dbPort = DB.dbInstanceEndpointPort;
  }
}
