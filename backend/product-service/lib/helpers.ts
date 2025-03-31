import * as iam from "aws-cdk-lib/aws-iam";
import { SNS, AWSError } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import type { Construct } from "constructs";

const { PRODUCTS_TABLE, PRODUCT_STOCKS_TABLE, REGION } = process.env;

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
    `arn:aws:dynamodb:us-east-1:311141532338:table/${PRODUCTS_TABLE}`,
    `arn:aws:dynamodb:us-east-1:311141532338:table/${PRODUCT_STOCKS_TABLE}`,
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

export const createTopic = ({
  topicName,
}: {
  topicName: string;
}): Promise<PromiseResult<SNS.CreateTopicResponse, AWSError>> => {
  return new SNS({ region: REGION })
    .createTopic({
      Name: topicName,
    })
    .promise();
};

export const subscribeEmailTopic = ({
  topicArn,
  email,
}: {
  topicArn: string;
  email: string;
}): Promise<PromiseResult<SNS.SubscribeResponse, AWSError>> => {
  const params = {
    Protocol: "EMAIL",
    TopicArn: topicArn,
    Endpoint: email,
  };

  return new SNS().subscribe(params).promise();
};
