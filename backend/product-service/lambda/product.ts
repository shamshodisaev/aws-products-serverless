import { EventSourceMapping } from "aws-cdk-lib/aws-lambda";
const products = require("./products.json");

exports.handler = async (event: any) => {
  try {
    const productId = event.pathParameters.id;

    const product = products.find((product: any) => product.id === productId);

    if (!product) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: product }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: product }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error }),
    };
  }
};
