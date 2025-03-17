import { fromIni } from "@aws-sdk/credential-providers";
import { HttpRequest } from "@smithy/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@smithy/url-parser";
import { formatUrl } from "@aws-sdk/util-format-url";
import { Hash } from "@smithy/hash-node";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

const BUCKET = "node-aws-shop-files";
const REGION = "us-east-1";

exports.handler = async (event: any) => {
  try {
    const { name: key } = event.queryStringParameters;

    console.log(key);

    return {
      statusCode: 200,
      body: await createPresignedUrlWithoutClient({
        region: REGION,
        bucket: BUCKET,
        key,
      }),
    };
  } catch (error) {
    return JSON.stringify(error);
  }
};

const createPresignedUrlWithoutClient = async ({
  region,
  bucket,
  key,
}: {
  [key: string]: string;
}) => {
  const url = parseUrl(
    `https://${bucket}.s3.${region}.amazonaws.com/uploaded/${key}`
  );
  const presigner = new S3RequestPresigner({
    credentials: defaultProvider(),
    region,
    sha256: Hash.bind(null, "sha256"),
  });

  const signedUrlObject = await presigner.presign(
    new HttpRequest({ ...url, method: "PUT" })
  );
  return formatUrl(signedUrlObject);
};
