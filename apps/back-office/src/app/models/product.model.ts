export interface Product {
  productID: string;
  name: string;
  price: number;
  quantity: number;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
