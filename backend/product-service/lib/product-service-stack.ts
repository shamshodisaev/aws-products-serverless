import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";

const environment = {
  PRODUCTS_TABLE: "products",
  PRODUCT_STOCKS_TABLE: "product-stocks",
};

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoDbPolicy = new iam.PolicyStatement({
      actions: [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
      ],
      resources: [
        `arn:aws:dynamodb:us-east-1:311141532338:table/${environment.PRODUCTS_TABLE}`,
        `arn:aws:dynamodb:us-east-1:311141532338:table/${environment.PRODUCT_STOCKS_TABLE}`,
      ],
    });

    const lambdaRole = new iam.Role(this, "LambdaDynamoDBRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaVPCAccessExecutionRole"
      )
    );
    lambdaRole.addToPolicy(dynamoDbPolicy);

    const getProductsList = new lambda.Function(this, "ProductsList", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "products.handler",
      environment,
      role: lambdaRole,
    });

    const createProduct = new lambda.Function(this, "CreateProduct", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "create-product.handler",
      environment,
      role: lambdaRole,
    });

    const getProductById = new lambda.Function(this, "Product", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "product.handler",
      environment,
      role: lambdaRole,
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
  }
}
