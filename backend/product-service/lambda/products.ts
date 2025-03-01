import { type EventSourceMapping } from "aws-cdk-lib/aws-lambda";

const products = [
  {
    id: "1",
    title: "Product 1",
    description: "Description of the product 1",
  },
  {
    id: "2",
    title: "Product 2",
    description: "Description of the product 2",
  },
  {
    id: "3",
    title: "Product 3",
    description: "Description of the product 3",
  },
  {
    id: "4",
    title: "Product 4",
    description: "Description of the product 4",
  },
];

exports.handler = async (event: EventSourceMapping) => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ data: products }),
  };
};
