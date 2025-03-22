import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createReadStream } from "fs";
import * as csv from "csv-parser";
import { Stream } from "stream";

const s3 = new S3Client({ region: "us-east-1" });

exports.handler = async (event: any) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const params = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const getObjectCommand = new GetObjectCommand(params);

    const data = await s3.send(getObjectCommand);
    const readStream = data.Body as Stream;

    const results: unknown[] = [];

    readStream
      .pipe(csv())
      .on("data", (data: unknown) => {
        results.push(data);
      })
      .on("end", () => {
        console.log(results, "results");
      })
      .on("error", (err: any) => {
        throw new Error(err);
      });
  } catch (err) {
    const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    console.log(err, message);
    throw new Error(message);
  }
};
