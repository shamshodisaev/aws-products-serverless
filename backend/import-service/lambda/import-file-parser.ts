import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });

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
    const { ContentType, ...file } = await s3.send(
      new HeadObjectCommand(params)
    );

    console.log("CONTENT TYPE:", ContentType);
    console.log("file:", file);
    return ContentType;
  } catch (err) {
    console.log(err);
    const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    console.log(message);
    throw new Error(message);
  }
};
