export interface WishlistItem {
  id: string | number;
  priceWhenAdded: number;
  stockWhenAdded: number;
  addedAt: number;
  lastViewedAt?: number;
}

export interface FetchedItemData {
  id: string | number;
  price: number;
  stock: number;
}

export type AlertType =
  | "price_drop"
  | "low_stock"
  | "back_in_stock"
  | "reminder";

export interface WishlistAlert {
  id: string;
  itemId: string | number;
  type: AlertType;
  message: string;
  createdAt: number;
}
