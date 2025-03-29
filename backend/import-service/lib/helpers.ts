import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

export const getLambdaRole = ({
  bucketName,
  scope,
}: {
  scope: Construct;
  bucketName: string;
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
  });

  lambdaRole.addManagedPolicy(
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSLambdaBasicExecutionRole"
    )
  );

  const sqsPolicy = new iam.PolicyStatement({
    actions: ["sqs:*"],
    effect: iam.Effect.ALLOW,
    resources: ["arn:aws:sqs:us-east-1:123456789012:*"],
  });

  lambdaRole.addToPolicy(s3Policy);
  lambdaRole.addToPolicy(sqsPolicy);

  return lambdaRole;
};
