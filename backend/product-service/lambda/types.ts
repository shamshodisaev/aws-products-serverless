export type Product = {
  title: string;
  description: string;
  price: number | string;
};

export type ProductStock = {
  product_id: string;
  id: string;
  price: number | string;
};
