import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as iam from "aws-cdk-lib/aws-iam";
import { SqsToLambda } from "@aws-solutions-constructs/aws-sqs-lambda";
import { environment, getLambdaDynamoRole, getLambdaSqsRole } from "./helpers";

const CatalogItemsQueueARN = "CatalogItemsQueueArn";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaDynamoRole = getLambdaDynamoRole(this);

    const getProductsList = new lambda.Function(this, "ProductsList", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "products.handler",
      environment,
      role: lambdaDynamoRole,
    });

    const createProduct = new lambda.Function(this, "CreateProduct", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "create-product.handler",
      environment,
      role: lambdaDynamoRole,
    });

    const getProductById = new lambda.Function(this, "Product", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "product.handler",
      environment,
      role: lambdaDynamoRole,
    });

    const productApi = new apigateway.RestApi(this, "Products API", {
      restApiName: "Product Service API",
    });

    const productsResource = productApi.root.addResource("products");
    const productResource = productsResource.addResource("{id}");

    const productsListLambda = new apigateway.LambdaIntegration(
      getProductsList
    );
    const createProductLambda = new apigateway.LambdaIntegration(createProduct);
    const productByIdLambda = new apigateway.LambdaIntegration(getProductById);

    productsResource.addMethod("GET", productsListLambda);
    productsResource.addMethod("POST", createProductLambda);
    productResource.addMethod("GET", productByIdLambda);

    // sqs
    const queue = new sqs.Queue(this, "catalogItemsQueue", {
      queueName: "catalog-items-queue",
      fifo: false,
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // TODO: Fix sqs access for import-file-parser lambda
    new cdk.CfnOutput(this, "catalogItemsQueueArn", {
      value: queue.queueArn,
      exportName: CatalogItemsQueueARN,
      description: "The ARN of the catalog items SQS queue",
    });

    const lambdaSqsRole = getLambdaSqsRole(this);

    const catalogBatchProcess = new lambda.Function(
      this,
      "catalogSQSBatchProcess",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "catalog-batch-process.handler",
        role: lambdaSqsRole,
      }
    );

    new SqsToLambda(this, "catalogBatchSQSToLambda", {
      existingLambdaObj: catalogBatchProcess,
      existingQueueObj: queue,
      sqsEventSourceProps: {
        batchSize: 5,
        enabled: true,
      },
    });
  }
}
