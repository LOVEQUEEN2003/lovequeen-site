// データベースのバインディング型定義
export interface Env {
  DB: D1Database;
}

// ユーザー関連の型
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // SNS関連フィールド
  twitter_handle?: string;
  instagram_handle?: string;
  facebook_url?: string;
  youtube_url?: string;
  tiktok_handle?: string;
  linkedin_url?: string;
  website_url?: string;
  bio?: string;
}

export interface UserAddress {
  id: number;
  user_id: number;
  name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line: string;
  building?: string;
  phone?: string;
  is_default: boolean;
  created_at: string;
}

// 商品関連の型
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category_id?: number;
  sku?: string;
  weight?: number;
  dimensions?: string;
  status: 'active' | 'inactive' | 'draft';
  featured: boolean;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// 在庫関連の型
export interface Inventory {
  id: number;
  product_id: number;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

// カート関連の型
export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
  product_image?: ProductImage;
}

// 注文関連の型
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentMethod = 'credit_card' | 'paypay' | 'paidy' | 'bank_transfer' | 'convenience_store';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  total_amount: number;
  
  // 配送先住所
  shipping_name: string;
  shipping_postal_code: string;
  shipping_prefecture: string;
  shipping_city: string;
  shipping_address_line: string;
  shipping_building?: string;
  shipping_phone: string;
  
  // 決済情報
  payment_transaction_id?: string;
  payment_confirmed_at?: string;
  
  // 配送情報
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  total_price: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// API レスポンス型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 認証関連の型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

// 注文作成リクエスト型
export interface CreateOrderRequest {
  shipping_address: {
    name: string;
    postal_code: string;
    prefecture: string;
    city: string;
    address_line: string;
    building?: string;
    phone: string;
  };
  payment_method: PaymentMethod;
  notes?: string;
}

// 決済関連の型
export interface PaymentResult {
  success: boolean;
  transaction_id?: string;
  error?: string;
  redirect_url?: string;
}

// 商品検索パラメータ
export interface ProductSearchParams {
  category?: number;
  keyword?: string;
  min_price?: number;
  max_price?: number;
  featured?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'price_asc' | 'price_desc' | 'name' | 'created_at';
}

// SNS関連の型
export interface ShopSocialAccount {
  id: number;
  platform: 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'linkedin';
  handle?: string;
  url: string;
  display_name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SocialShare {
  id: number;
  user_id?: number;
  product_id: number;
  platform: 'twitter' | 'facebook' | 'instagram' | 'line' | 'copy_link';
  shared_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  bio?: string;
  twitter_handle?: string;
  instagram_handle?: string;
  facebook_url?: string;
  youtube_url?: string;
  tiktok_handle?: string;
  linkedin_url?: string;
  website_url?: string;
}