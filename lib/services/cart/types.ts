export interface CartItem {
  _id: string;           // Product ID
  _uid: string;          // Unique identifier (product_style_size)
  name: string;
  price: number;
  qty: number;
  size: string;
  images: any[];
  quantity: number;      // Available stock
  discount?: number;
  style?: number;        // Product variant
  color?: {
    color: string;
    image: string;
  };
  vendor?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  userId?: string;       // For registered users
  sessionId?: string;    // For guest users
  items: CartItem[];
  total: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;    // TTL for Redis
}

export interface CartUpdatePayload {
  items: CartItem[];
  userId?: string;
  sessionId?: string;
}

export interface CartRetrievalResult {
  cart: Cart | null;
  source: 'redis' | 'localStorage';
  success: boolean;
  message?: string;
}

export interface CartUpdateResult {
  success: boolean;
  cart?: Cart;
  message?: string;
  errors?: string[];
}

// Storage tier priorities (Redis + localStorage only)
export enum StorageTier {
  REDIS = 1,      // Primary - fast access
  BROWSER = 2     // Fallback - guest users and backup
}

// Cart operation types
export enum CartOperation {
  ADD_ITEM = 'ADD_ITEM',
  UPDATE_ITEM = 'UPDATE_ITEM',
  REMOVE_ITEM = 'REMOVE_ITEM',
  CLEAR_CART = 'CLEAR_CART',
  SYNC_CART = 'SYNC_CART'
}

// Configuration for cart management (Redis + localStorage only)
export interface CartConfig {
  redis: {
    ttl: number;           // 2 days in seconds
    keyPrefix: string;     // 'cart:'
    cleanupInterval: number; // Cleanup job interval
  };
  browser: {
    storageKey: string;    // localStorage key
    maxSize: number;       // Max items in browser storage
  };
}

export const DEFAULT_CART_CONFIG: CartConfig = {
  redis: {
    ttl: 172800, // 2 days (48 hours)
    keyPrefix: 'cart:',
    cleanupInterval: 3600, // 1 hour
  },
  browser: {
    storageKey: 'vibecart-storage',
    maxSize: 50, // Max 50 items
  },
}; 