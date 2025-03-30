import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";

export const getLambdaRole = ({
  bucketName,
  scope,
  accountId,
  queueArn,
}: {
  scope: Construct;
  bucketName: string;
  accountId: string | number;
  queueArn: string;
}) => {
  const s3Policy = new iam.PolicyStatement({
    actions: [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:GetObject",
      "s3:ListBucket",
    ],
    resources: [`arn:aws:s3:::${bucketName}/*`, `arn:aws:s3:::${bucketName}`],
  });

  const lambdaRole = new iam.Role(scope, "LambdaS3Role", {
    assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    roleName: "import-service-lambda",
  });

  lambdaRole.addManagedPolicy(
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSLambdaBasicExecutionRole"
    )
  );

  const sqsPolicy = new iam.PolicyStatement({
    actions: [
      "sqs:ChangeMessageVisibility",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
      "sqs:ReceiveMessage",
      "sqs:SendMessage",
    ],
    effect: iam.Effect.ALLOW,
    resources: [`arn:aws:sqs:us-east-1:${accountId}:catalog-items-queue`],
  });

  // const queue = sqs.Queue.fromQueueArn(scope, "ImportedQueue", queueArn);

  // queue.grantSendMessages(lambdaRole);
  // queue.grantConsumeMessages(lambdaRole);

  lambdaRole.addToPolicy(s3Policy);
  lambdaRole.addToPolicy(sqsPolicy);

  return lambdaRole;
};
