-- SNS連携機能追加のマイグレーション

-- ユーザーテーブルにSNSアカウント情報追加
ALTER TABLE users ADD COLUMN twitter_handle TEXT;
ALTER TABLE users ADD COLUMN instagram_handle TEXT; 
ALTER TABLE users ADD COLUMN facebook_url TEXT;
ALTER TABLE users ADD COLUMN youtube_url TEXT;
ALTER TABLE users ADD COLUMN tiktok_handle TEXT;
ALTER TABLE users ADD COLUMN linkedin_url TEXT;
ALTER TABLE users ADD COLUMN website_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;

-- SNSシェア履歴テーブル（将来の分析用）
CREATE TABLE IF NOT EXISTS social_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  product_id INTEGER,
  platform TEXT NOT NULL CHECK(platform IN ('twitter', 'facebook', 'instagram', 'line', 'copy_link')),
  shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 企業・ショップのSNSアカウント情報テーブル
CREATE TABLE IF NOT EXISTS shop_social_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL UNIQUE CHECK(platform IN ('twitter', 'instagram', 'facebook', 'youtube', 'tiktok', 'linkedin')),
  handle TEXT,
  url TEXT,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ショップのデフォルトSNSアカウント情報を挿入
INSERT OR IGNORE INTO shop_social_accounts (platform, handle, url, display_name, is_active, sort_order) VALUES 
  ('twitter', '@lovequeen_jp', 'https://twitter.com/lovequeen_jp', 'Twitter/X', true, 1),
  ('instagram', '@lovequeen.jp', 'https://instagram.com/lovequeen.jp', 'Instagram', true, 2),
  ('facebook', '', 'https://facebook.com/lovequeen.jp', 'Facebook', true, 3),
  ('youtube', '@LoveQueen公式', 'https://youtube.com/@lovequeen_jp', 'YouTube', true, 4),
  ('tiktok', '@lovequeen.jp', 'https://tiktok.com/@lovequeen.jp', 'TikTok', true, 5),
  ('linkedin', '', 'https://linkedin.com/company/lovequeen', 'LinkedIn', true, 6);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_social_shares_user ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_product ON social_shares(product_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON social_shares(platform);
CREATE INDEX IF NOT EXISTS idx_shop_social_platform ON shop_social_accounts(platform);