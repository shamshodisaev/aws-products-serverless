import type { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";

export const environment = {
  PRODUCTS_TABLE: "products",
  PRODUCT_STOCKS_TABLE: "product-stocks",
};

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

const sqsPolicy = new iam.PolicyStatement({
  actions: ["sqs:*"],
  effect: iam.Effect.ALLOW,
  resources: ["arn:aws:sqs:us-east-1:123456789012:*"],
});

export const getLambdaSqsRole = function (scope: Construct) {
  const lambdaSqsRole = new iam.Role(scope, "LambdaDynamoSqsRole", {
    assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    roleName: "product-service-sqs-lambda",
  });

  lambdaSqsRole.addManagedPolicy(
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSLambdaBasicExecutionRole"
    )
  );

  lambdaSqsRole.addToPolicy(sqsPolicy);

  lambdaSqsRole.addToPolicy(dynamoDbPolicy);

  return lambdaSqsRole;
};

export const getLambdaDynamoRole = function (scope: Construct) {
  const lambdaRole = new iam.Role(scope, "LambdaDynamoDBRole", {
    assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    roleName: "product-service-dynamo-lambda",
  });

  lambdaRole.addManagedPolicy(
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSLambdaBasicExecutionRole"
    )
  );

  lambdaRole.addToPolicy(dynamoDbPolicy);

  return lambdaRole;
};
