export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category_id: number;
  category_name?: string;
  image_url: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  date: string;
  total: number;
  items: CartItem[];
}
