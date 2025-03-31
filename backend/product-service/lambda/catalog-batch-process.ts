import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, PutCommand } from "@aws-sdk/lib-dynamodb";
import { corsHeaders } from "./product-utils";
import { randomUUID } from "crypto";
import { ProductStock } from "./types";
import { deleteSQSMessage } from "./message-utils";

const { PRODUCTS_TABLE, PRODUCT_STOCKS_TABLE, REGION, ACCOUNT_ID } =
  process.env;

const dynamoClient = new DynamoDBClient({ region: REGION });
const dynamo = DynamoDBDocument.from(dynamoClient);

exports.handler = async (event: any) => {
  try {
    let { body: products, receiptHandle } = event.Records[0];
    products = JSON.parse(products);

    const areValidProducts = products.every(
      ({ Name, Description, Price, Count }: any) =>
        Boolean(Name) &&
        Boolean(Description) &&
        Boolean(+Price) &&
        Boolean(+Count)
    );

    if (!areValidProducts) {
      console.log("Invalid products");
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: "Invalid products!",
      };
    }

    console.log(products, "records");

    const stockProducts: ProductStock[] = [];

    const createProducts: Promise<unknown>[] = products.map(
      ({ Count, Name, Description, Price }: any) => {
        const productId = randomUUID();

        const productStock = {
          product_id: productId,
          price: +Price,
          id: randomUUID(),
        };
        const product = {
          title: Name,
          description: Description,
          count: Count,
          id: productId,
        };

        stockProducts.push(productStock);

        return dynamo.send(
          new PutCommand({ TableName: PRODUCTS_TABLE, Item: product })
        );
      }
    );

    const createProductStocks = stockProducts.map((productStock) =>
      dynamo.send(
        new PutCommand({ Item: productStock, TableName: PRODUCT_STOCKS_TABLE })
      )
    );

    // TODO: transactions
    await Promise.all(createProducts);

    await Promise.all(createProductStocks);

    await deleteSQSMessage({
      receiptHandleId: receiptHandle,
      accountId: ACCOUNT_ID!,
      region: REGION!,
    });

    console.log(`Products have been added!`);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "Products created",
    };
  } catch (error) {
    console.log(`Error in proccessing productss: ${error}`);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error),
    };
  }
};
