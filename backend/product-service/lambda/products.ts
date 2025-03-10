import {
  DynamoDBClient,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { type EventSourceMapping } from "aws-cdk-lib/aws-lambda";
import { corsHeaders } from "./product-utils";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async (event: EventSourceMapping) => {
  try {
    const { Items: productsData } = await dynamo.send(
      new ScanCommand({ TableName: process.env.PRODUCTS_TABLE })
    );

    const { Items: stocksData } = await dynamo.send(
      new ScanCommand({ TableName: process.env.PRODUCT_STOCKS_TABLE })
    );

    const products = productsData?.map((product) => {
      const productStock = stocksData?.find(
        (stock) => stock.product_id.S === product.id.S
      );

      return {
        ...product,
        ...(productStock?.price ? { price: productStock?.price } : {}),
      };
    });

    const normalizedProducts = products?.map((product) => unmarshall(product));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
      body: JSON.stringify({ data: normalizedProducts }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
      body: JSON.stringify({ message: "Something wrong happened!" }),
    };
  }
};
