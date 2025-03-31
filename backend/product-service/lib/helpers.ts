import * as iam from "aws-cdk-lib/aws-iam";
import { SNS, AWSError } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import type { Construct } from "constructs";

const { PRODUCTS_TABLE, PRODUCT_STOCKS_TABLE, REGION, ACCOUNT_ID } =
  process.env;

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

const snsPolicy = new iam.PolicyStatement({
  actions: ["sns:*"],
  effect: iam.Effect.ALLOW,
  resources: [`arn:aws:sns:us-east-1:${ACCOUNT_ID}:*`],
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
  lambdaSqsRole.addToPolicy(snsPolicy);

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

export const createTopic = async ({
  topicName,
}: {
  topicName: string;
}): Promise<PromiseResult<SNS.CreateTopicResponse, AWSError>> => {
  const sns = new SNS({ region: REGION });

  // Create the SNS topic
  const topicResponse = await sns
    .createTopic({
      Name: topicName,
    })
    .promise();

  const topicArn = topicResponse.TopicArn;

  if (!topicArn) {
    throw new Error("Failed to create topic");
  }

  const lambdaArn = `arn:aws:lambda:us-east-1:${ACCOUNT_ID}:function:ProductService-CatalogBatchProcess`;
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
        Action: "sns:Publish",
        Resource: topicArn,
        Condition: { ArnEquals: { "AWS:SourceArn": lambdaArn } },
      },
    ],
  };

  await sns
    .setTopicAttributes({
      TopicArn: topicArn,
      AttributeName: "Policy",
      AttributeValue: JSON.stringify(policy),
    })
    .promise();

  return topicResponse;
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
