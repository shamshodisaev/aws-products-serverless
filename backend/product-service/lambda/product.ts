import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { corsHeaders } from "./product-utils";

const headers = {
  "Content-Type": "application/json",
  ...corsHeaders,
};

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async (event: any) => {
  try {
    const productId = event.pathParameters.id;

    const { Items: productItems } = await dynamo.send(
      new QueryCommand({
        TableName: process.env.PRODUCTS_TABLE,
        KeyConditionExpression: "#id = :idVal",
        ExpressionAttributeNames: {
          "#id": "id",
        },
        ExpressionAttributeValues: {
          ":idVal": productId,
        },
      })
    );

    if (!productItems?.length) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Not found!" }),
      };
    }

    let price = undefined;

    try {
      const { Items } = await dynamo.send(
        new QueryCommand({
          TableName: process.env.PRODUCT_STOCKS_TABLE,
          KeyConditionExpression: "product_id = :productId",
          ExpressionAttributeValues: {
            ":productId": productItems?.[0].id,
          },
        })
      );
      price = Items?.[0]?.price;
    } catch (error) {
      console.log(error, "error");
    }

    const priceObj = price ? { price } : {};

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: { ...productItems, ...priceObj } }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error }),
    };
  }
};
