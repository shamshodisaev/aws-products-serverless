import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { corsHeaders } from "./product-utils";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async (event: any) => {
  try {
    const { price, ...product } =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const productId = randomUUID();

    if (!product.title || !price) {
      return {
        statusCode: 400,
        headers: corsHeaders,
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
