-- デモ用データ挿入

-- 管理者ユーザー
INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES 
  ('admin@ecsite.com', 'hashed_admin_password', '管理者', 'admin');

-- カテゴリ
INSERT OR IGNORE INTO categories (name, description, sort_order) VALUES 
  ('電化製品', 'スマートフォン、パソコンなどの電子機器', 1),
  ('ファッション', '衣類、アクセサリー', 2),
  ('本・雑誌', '書籍、雑誌、電子書籍', 3),
  ('スポーツ・アウトドア', 'スポーツ用品、アウトドアグッズ', 4),
  ('食品・飲料', '食べ物、飲み物', 5);

-- サンプル商品
INSERT OR IGNORE INTO products (name, description, price, category_id, sku, weight, status, featured) VALUES 
  ('iPhone 15', '最新のiPhoneです。高性能カメラとA17 Proチップを搭載。', 124800, 1, 'IPHONE15-128', 171, 'active', true),
  ('MacBook Air M3', '13インチの薄型軽量ノートパソコン', 148800, 1, 'MBA-M3-13', 1240, 'active', true),
  ('ワイヤレスイヤホン', 'ノイズキャンセリング機能付き', 29800, 1, 'WH-1000XM5', 250, 'active', false),
  ('デニムジャケット', 'カジュアルなデニムジャケット', 8900, 2, 'DENIM-JKT-M', 600, 'active', true),
  ('スニーカー', '人気ブランドのランニングシューズ', 12000, 2, 'SNEAKER-27', 800, 'active', false),
  ('プログラミング入門書', 'Python初心者向けの解説書', 2980, 3, 'BOOK-PYTHON', 350, 'active', false),
  ('ランニングシューズ', '長距離ランニング用の軽量シューズ', 15800, 4, 'RUN-SHOES-26', 280, 'active', true),
  ('プロテイン 1kg', 'ホエイプロテイン バニラ味', 4980, 5, 'PROTEIN-1KG-V', 1000, 'active', false);

-- 商品画像（サンプル）
INSERT OR IGNORE INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES 
  (1, '/static/images/iphone15.jpg', 'iPhone 15 画像', 1, true),
  (2, '/static/images/macbook-air-m3.jpg', 'MacBook Air M3 画像', 1, true),
  (3, '/static/images/wireless-earphones.jpg', 'ワイヤレスイヤホン 画像', 1, true),
  (4, '/static/images/denim-jacket.jpg', 'デニムジャケット 画像', 1, true),
  (5, '/static/images/sneaker.jpg', 'スニーカー 画像', 1, true),
  (6, '/static/images/python-book.jpg', 'Python入門書 画像', 1, true),
  (7, '/static/images/running-shoes.jpg', 'ランニングシューズ 画像', 1, true),
  (8, '/static/images/protein.jpg', 'プロテイン 画像', 1, true);

-- 在庫データ
INSERT OR IGNORE INTO inventory (product_id, stock_quantity, reserved_quantity, low_stock_threshold) VALUES 
  (1, 50, 0, 5),
  (2, 30, 0, 3),
  (3, 100, 0, 10),
  (4, 20, 0, 5),
  (5, 15, 0, 3),
  (6, 80, 0, 10),
  (7, 25, 0, 5),
  (8, 200, 0, 20);

-- テスト用顧客ユーザー
INSERT OR IGNORE INTO users (email, password_hash, name, phone) VALUES 
  ('customer@example.com', 'hashed_customer_password', '田中太郎', '090-1234-5678'),
  ('user2@example.com', 'hashed_user2_password', '佐藤花子', '080-9876-5432');

-- テスト用住所
INSERT OR IGNORE INTO user_addresses (user_id, name, postal_code, prefecture, city, address_line, building, phone, is_default) VALUES 
  (2, '田中太郎', '100-0001', '東京都', '千代田区', '千代田1-1-1', 'ABCマンション101', '090-1234-5678', true),
  (3, '佐藤花子', '150-0002', '東京都', '渋谷区', '渋谷2-2-2', '', '080-9876-5432', true);