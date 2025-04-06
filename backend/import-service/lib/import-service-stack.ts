import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dotenv from "dotenv";
import { getLambdaRole } from "./helpers";

const BUCKET = "node-aws-shop-files";

dotenv.config();

const region = "us-east-1";
const { ACCOUNT_ID } = process.env;
const CatalogItemsQueueARN = "CatalogItemsQueueArn";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queueArn = cdk.Fn.importValue(CatalogItemsQueueARN);
    const lambdaRole = getLambdaRole({
      scope: this,
      bucketName: BUCKET,
      accountId: ACCOUNT_ID!,
      queueArn,
    });

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
      environment: {
        REGION: region,
        ACCOUNT_ID: ACCOUNT_ID!,
      },
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

    const lambdaAuthorizer = new apigateway.TokenAuthorizer(
      this,
      "LambdaAuthorizer",
      {
        handler: lambda.Function.fromFunctionArn(
          this,
          "LambdAuthorizer",
          `arn:aws:lambda:us-east-1:${ACCOUNT_ID}:function:basic-authorizer`
        ),
      }
    );

    const importsApi = new apigateway.RestApi(this, "Imports API", {
      restApiName: "Import Products API",
    });

    const importResource = importsApi.root.addResource("imports");

    const importProductsFileLambda = new apigateway.LambdaIntegration(
      importProductFile
    );

    importResource.addMethod("POST", importProductsFileLambda, {
      authorizer: lambdaAuthorizer,
    });
  }
}
