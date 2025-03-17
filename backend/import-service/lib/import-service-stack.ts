import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

const BUCKET = "node-aws-shop-files";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3Policy = new iam.PolicyStatement({
      actions: ["s3:PutObject", "s3:PutObjectAcl", "s3:GetObject"],
      resources: [`arn:aws:s3:::${BUCKET}/*`, `arn:aws:s3:::${BUCKET}`],
    });

    const lambdaRole = new iam.Role(this, "LambdaS3Role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    lambdaRole.addToPolicy(s3Policy);

    const importProductFile = new lambda.Function(this, "ImportProductsFile", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "import-products-file.handler",
      role: lambdaRole,
    });

    const importFileParser = new lambda.Function(this, "ImportFileParser", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "import-file-parser.handler",
      role: lambdaRole,
    });

    const shopBucket = s3.Bucket.fromBucketName(this, "AwsShopBucket", BUCKET);

    shopBucket.grantRead(importFileParser);
    shopBucket.grantPut(importFileParser);
    shopBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      {
        prefix: "uploaded",
      }
    );

    const importsApi = new apigateway.RestApi(this, "Imports API", {
      restApiName: "Import Products API",
    });

    const importResource = importsApi.root.addResource("imports");

    const importProductsFileLambda = new apigateway.LambdaIntegration(
      importProductFile
    );

    importResource.addMethod("POST", importProductsFileLambda);
  }
}
