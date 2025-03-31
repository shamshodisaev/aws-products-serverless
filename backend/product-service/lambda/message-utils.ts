import { AWSError, SNS, SQS } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";

export const deleteSQSMessage = async ({
  accountId,
  receiptHandleId,
  region,
}: {
  receiptHandleId: string;
  region: string;
  accountId: string;
}) => {
  const sqs = new SQS({ region });
  const queueURL = `https://sqs.${region}.amazonaws.com/${accountId}/catalog-items-queue`;

  const deleteParams = {
    QueueUrl: queueURL,
    ReceiptHandle: receiptHandleId,
  };

  try {
    await sqs.deleteMessage(deleteParams).promise();
  } catch (error) {
    console.log(`Error in deleting message: ${error}`);
  }
};

export const sendSNSMessage = ({
  message,
  region,
  topicArn,
}: {
  message: string;
  region: string;
  topicArn: string;
}): undefined | Promise<PromiseResult<SNS.PublishResponse, AWSError>> => {
  try {
    const params = {
      Message: message,
      TopicArn: topicArn,
    };

    return new SNS({ region }).publish(params).promise();
  } catch (error) {
    console.log(`Error in sending message: ${error}`);
    return;
  }
};
