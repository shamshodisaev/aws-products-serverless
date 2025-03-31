import { SQS } from "aws-sdk";

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
