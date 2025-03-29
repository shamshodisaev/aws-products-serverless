import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as csv from "csv-parser";
import { Stream } from "stream";
import { SQS, config } from "aws-sdk";

const { REGION, ACCOUNT_ID } = process.env;
const SQS_QUEUE_URL = `https://sqs.${REGION}.amazonaws.com/${ACCOUNT_ID}/ProductServiceStack-catalogItemsQueue79451959-DsvlbOxmB3T6`;

// TODO: define root region variable
const s3 = new S3Client({ region: REGION });
const sqs = new SQS({ apiVersion: "2012-11-05" });
config.update({ region: REGION });

exports.handler = async (event: any) => {
  const s3Params = getS3Params(event);

  try {
    const getObjectCommand = new GetObjectCommand(s3Params);

    const bucketData = await s3.send(getObjectCommand);
    const readStream = bucketData.Body as Stream;

    const results: unknown[] = [];

    readStream
      .pipe(csv())
      .on("data", (data: unknown) => results.push(data))
      .on("end", () => {
        console.log(results, "results");
        const sqsParams = getSqsParams(JSON.stringify(results));

        sqs.sendMessage(sqsParams, function (err, data) {
          if (err) {
            console.log("Error", err);
          } else {
            console.log("Success", data.MessageId);
          }
        });
      })
      .on("error", (err: any) => {
        throw new Error(err);
      });
  } catch (err) {
    const message = `Error getting object ${s3Params.Key} from bucket ${s3Params.Bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    console.log(err, message);
    throw new Error(message);
  }
};

const getS3Params = (event: any) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  return {
    Bucket: bucket,
    Key: key,
  };
};

const getSqsParams = (messageBody: string) => {
  return {
    DelaySeconds: 10,
    MessageAttributes: {
      Title: {
        DataType: "String",
        StringValue: "Products",
      },
    },
    MessageBody: messageBody,
    QueueUrl: SQS_QUEUE_URL,
  };
};
