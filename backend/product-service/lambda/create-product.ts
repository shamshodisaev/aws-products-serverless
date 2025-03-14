import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 } from "uuid";
import { corsHeaders } from "./product-utils";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async (event: any) => {
  try {
    const { price, ...product } = JSON.parse(event.body);
    const productId = v4();

    if (!product.title || !price) {
      return {
        statusCode: 400,
        Headers: corsHeaders,
        body: JSON.stringify({ error: "Bad request!" }),
      };
    }

    await dynamo.send(
      new PutCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Item: {
          ...product,
          id: productId,
        },
      })
    );

    await dynamo.send(
      new PutCommand({
        TableName: process.env.PRODUCT_STOCKS_TABLE,
        Item: {
          product_id: productId,
          price,
        },
      })
    );

    return {
      statusCode: 202,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
      body: JSON.stringify({
        message: "Created successfully!",
        product: { ...product, price },
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
      body: JSON.stringify({ error: "Something wrong happened!" }),
    };
  }
};
