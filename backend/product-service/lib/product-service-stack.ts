import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'ProductServiceQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const getProductsList = new lambda.Function(this, "ProductsList", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "products.handler",
    });

    const getProductById = new lambda.Function(this, "Product", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "product.handler",
    });

    const productApi = new apigateway.RestApi(this, "Products API", {
      restApiName: "Product Service API",
    });

    const productsResource = productApi.root.addResource("products");
    const productResource = productsResource.addResource("{id}");

    const productsListLambda = new apigateway.LambdaIntegration(
      getProductsList
    );
    const productByIdLambda = new apigateway.LambdaIntegration(getProductById);

    productsResource.addMethod("GET", productsListLambda);
    productResource.addMethod("GET", productByIdLambda);
  }
}
