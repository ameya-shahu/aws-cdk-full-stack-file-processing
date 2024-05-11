import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';


export class CdkSetupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const REGION = 'us-east-2';

    /* IAM role defined for all the resources within the stack */
    const role = new iam.Role(this, 'fovus-stack-role', {
      roleName: 'fovus-stack-role',
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('ec2.amazonaws.com'),
        new iam.ServicePrincipal('s3.amazonaws.com'),
        new iam.ServicePrincipal('dynamodb.amazonaws.com')
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess')
      ]
    });

    /* InstanceProfile for EC2 instance created for file processing */
    const instanceProfile = new iam.CfnInstanceProfile(this, "fovus-ec2-instance-profile",{
      roles: [role.roleName]
    })

    /* S3 bucket to store all the input and output txt files */
    const s3Bucket = new s3.Bucket(this, 'fovus-stack-s3-main-bucket', {
      bucketName: 'fovus-stack-s3-main-bucket',
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ['*']
        }
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // Attach IAM role to S3 Bucket
    s3Bucket.grantReadWrite(role);


    /* Dynamodb configuration */
    const fileTable = new dynamodb.Table(this, 'fovus-file-table', {
      tableName: 'fovus-files-table',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE
    });

    // Attach IAM role to DynamoDB Table
    fileTable.grantReadWriteData(role);


    /* Lambda functions */
    const s3PresignedUrlLambdaCodePath = path.join(__dirname, '..','..', 'lambda-functions', 's3-presigned-url-func');
    const dynamodbLambdaCodePath = path.join(__dirname, '..','..', 'lambda-functions', 'dynamodb-func');
    const createEc2LambdaCodePath = path.join(__dirname, '..','..', 'lambda-functions', 'create-ec2-func');

    // Function to generate presignedUrl for S3 file upload
    const s3PresignedUrlFunction = new lambda.Function(this, 'fovus-s3-presigned-url-func', {
      functionName: "fovus-s3-presigned-url-func",
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(s3PresignedUrlLambdaCodePath),
      handler: 'index.handler',
      role: role,
      environment: {
        REGION: REGION,
        BUCKET_NAME: s3Bucket.bucketName
      }
    });

    // Function to store user input to dynamodb
    const dynamodbFunction = new lambda.Function(this, 'fovus-dyanmodb-func', {
      functionName: "fovus-dyanmodb-func",
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(dynamodbLambdaCodePath),
      handler: 'index.handler',
      role: role
    });

    // Function to run EC2 VM to process file
    const createEc2Function = new lambda.Function(this, 'fovus-create-ec2-func', {
      functionName: "fovus-create-ec2-func",
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(createEc2LambdaCodePath),
      handler: 'index.handler',
      role: role,
      environment: {
        ROLE_ARN: instanceProfile.attrArn,
        FILE_TABLE: fileTable.tableName,
        REGION: REGION
      }
    });

    // Dyanamodb Stream based event trigger on insertion
    createEc2Function.addEventSource(new lambdaEventSources.DynamoEventSource(fileTable, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 1,
      filters: [
        {
          pattern: "{ \"eventName\": [\"INSERT\"]}"
        }
      ]
    }))

    /* API gateway */
    const api = new apigateway.RestApi(this, 'fovus-rest-api', {
      restApiName: 'fovus-rest-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      }
    });

    const s3Resource = api.root.addResource('s3');
    s3Resource.addResource('presignedurl').addMethod('POST', new apigateway.LambdaIntegration(s3PresignedUrlFunction));

    const dynamodbResource = api.root.addResource('dyanamodb');
    dynamodbResource.addResource('userinput').addMethod('POST', new apigateway.LambdaIntegration(dynamodbFunction));


    /* Add API Endpoint in stack metadata */
    const endpointOutput = new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
    });
  }
}
