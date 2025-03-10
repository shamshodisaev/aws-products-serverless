import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const batchWriteItems = async (tableName: string, items: any[]) => {
  const BATCH_SIZE = 25;
  const batches = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    const params = {
      RequestItems: {
        [tableName]: batch.map((item) => ({
          PutRequest: { Item: item },
        })),
      },
    };

    try {
      const command = new BatchWriteCommand(params);
      const response = await ddbDocClient.send(command);
      if (
        response.UnprocessedItems &&
        Object.keys(response.UnprocessedItems).length > 0
      ) {
        console.error(
          "Some items were not processed:",
          response.UnprocessedItems
        );
      } else {
        console.log(`Batch write to ${tableName} successful.`);
      }
    } catch (error) {
      console.error(`Error writing to ${tableName}:`, error);
    }
  }
};

const main = async () => {
  try {
    console.log("Filling Products table...");
    await batchWriteItems("products", products);

    console.log("Filling product-stocks table...");
    await batchWriteItems("product-stocks", stocks);

    console.log("Tables successfully populated with mock data.");
  } catch (error) {
    console.error("Error populating tables:", error);
  }
};

const products = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Product 1",
    description: "Description of the product 1",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    title: "Product 2",
    description: "Description of the product 2",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    title: "Product 3",
    description: "Description of the product 3",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    title: "Product 4",
    description: "Description of the product 4",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    title: "Product 5",
    description: "Description of the product 5",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440006",
    title: "Product 6",
    description: "Description of the product 6",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440007",
    title: "Product 7",
    description: "Description of the product 7",
  },
];

const stocks = [
  {
    product_id: "560e8400-e29b-41d4-a716-446655440001",
    price: 24,
  },
  {
    product_id: "570e8400-e29b-41d4-a716-446655440001",
    price: 15,
  },
  {
    product_id: "580e8400-e29b-41d4-a716-446655440001",
    price: 23,
  },
  {
    product_id: "590e8400-e29b-41d4-a716-446655440001",
    price: 15,
  },
  {
    product_id: "600e8400-e29b-41d4-a716-446655440001",
    price: 23,
  },
  {
    product_id: "610e8400-e29b-41d4-a716-446655440001",
    price: 15,
  },
  {
    product_id: "620e8400-e29b-41d4-a716-446655440001",
    price: 18,
  },
];

main();
