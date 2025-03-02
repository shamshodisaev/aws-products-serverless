import { type EventSourceMapping } from "aws-cdk-lib/aws-lambda";
const products = require("./products.json");

exports.handler = async (event: EventSourceMapping) => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: products }),
  };
};
