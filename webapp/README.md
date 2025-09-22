# ECサイト - オンラインショップ

## プロジェクト概要
- **名前**: ECサイト（webapp）
- **目標**: 本格的なEコマース機能を備えたオンラインショッピングサイト
- **技術スタック**: Hono + TypeScript + Cloudflare Pages + D1 Database + TailwindCSS

## 公開URL
- **開発環境**: https://3000-i8yzuhjfhifnguke2arxj-6532622b.e2b.dev
- **API ヘルスチェック**: https://3000-i8yzuhjfhifnguke2arxj-6532622b.e2b.dev/api/health

## 現在実装済みの機能

### ✅ 基本機能（完了）
1. **ユーザー認証システム**
   - 新規ユーザー登録 (`POST /api/auth/register`)
   - ログイン・ログアウト (`POST /api/auth/login`)
   - プロフィール取得 (`GET /api/auth/profile`)
   - JWT トークンベース認証

2. **商品管理システム**
   - 商品一覧表示 (`GET /api/products`)
   - 商品詳細表示 (`GET /api/products/:id`)
   - カテゴリ別フィルタリング
   - 商品検索（キーワード・価格範囲）
   - ソート機能（価格・名前・新着順）
   - 人気商品表示 (`GET /api/products/featured/list`)

3. **ショッピングカート機能**
   - カートに商品追加 (`POST /api/cart/add`)
   - カート内容表示 (`GET /api/cart`)
   - 数量変更 (`PUT /api/cart/update/:id`)
   - 商品削除 (`DELETE /api/cart/remove/:id`)
   - カート全体クリア (`DELETE /api/cart/clear`)

4. **注文管理システム**
   - 注文作成 (`POST /api/orders/create`)
   - 注文履歴表示 (`GET /api/orders/history`)
   - 注文詳細表示 (`GET /api/orders/:id`)
   - 注文キャンセル (`POST /api/orders/:id/cancel`)

5. **在庫管理システム**
   - リアルタイム在庫確認
   - 在庫予約機能（注文時）
   - 在庫不足アラート
   - 低在庫しきい値管理

6. **フロントエンド UI**
   - レスポンシブデザイン（PC・タブレット・スマートフォン対応）
   - 商品一覧・詳細表示
   - カート機能
   - ユーザー認証フォーム
   - 検索・フィルタリング機能

7. **SNS連携機能** 🆕
   - ショップSNSアカウント表示（Twitter/X、Instagram、Facebook、YouTube、TikTok、LinkedIn）
   - ユーザープロフィールにSNSアカウント設定
   - 商品SNSシェア機能（Twitter、Facebook、LINE、リンクコピー）
   - SNSシェア統計記録

8. **独自ドメイン対応** 🆕
   - Cloudflare Pages本格デプロイ準備
   - カスタムドメイン設定ガイド
   - 本番環境用設定ファイル

## データ構造とストレージ

### Cloudflare D1 データベース
- **users**: ユーザー情報（顧客・管理者）
- **user_addresses**: ユーザー配送先住所
- **categories**: 商品カテゴリ
- **products**: 商品マスター
- **product_images**: 商品画像
- **inventory**: 在庫情報
- **cart_items**: ショッピングカート
- **orders**: 注文情報
- **order_items**: 注文商品詳細
- **email_logs**: メール送信ログ
- **coupons**: クーポン（拡張用）

### サンプルデータ
- **カテゴリ**: 電化製品、ファッション、本・雑誌、スポーツ・アウトドア、食品・飲料
- **商品**: iPhone 15、MacBook Air M3、ワイヤレスイヤホン、デニムジャケット、スニーカーなど8商品
- **在庫**: 各商品に十分な在庫数を設定

## API エンドポイント

### 認証 (`/api/auth`)
- `POST /register` - ユーザー登録
- `POST /login` - ログイン
- `GET /profile` - プロフィール取得（要認証）

### 商品 (`/api/products`)
- `GET /` - 商品一覧（検索・フィルタ・ソート対応）
- `GET /:id` - 商品詳細
- `GET /categories/list` - カテゴリ一覧
- `GET /featured/list` - 人気商品一覧

### カート (`/api/cart`) ※要認証
- `GET /` - カート内容取得
- `POST /add` - カートに追加
- `PUT /update/:id` - 数量更新
- `DELETE /remove/:id` - 商品削除
- `DELETE /clear` - カート全体クリア

### 注文 (`/api/orders`) ※要認証
- `POST /create` - 注文作成
- `GET /history` - 注文履歴
- `GET /:id` - 注文詳細
- `POST /:id/cancel` - 注文キャンセル

### SNS (`/api/social`) 🆕
- `GET /shop-accounts` - ショップSNSアカウント一覧
- `POST /share/:productId` - 商品シェア記録
- `GET /profile` - ユーザーSNSプロフィール取得（要認証）
- `PUT /profile` - ユーザーSNSプロフィール更新（要認証）
- `GET /stats/:productId` - 商品別シェア統計

### その他
- `GET /api/health` - ヘルスチェック

## 未実装機能（今後の開発予定）

### 🔄 決済システム統合
- PayPay決済
- Paidy（後払い）決済
- 銀行振込
- コンビニ決済
- クレジットカード決済（Stripe）

### 🔄 管理者ダッシュボード
- 商品管理（追加・編集・削除）
- 注文管理（ステータス更新・発送処理）
- 在庫管理（入荷・調整）
- ユーザー管理
- 売上レポート

### 🔄 メール通知システム
- 注文確認メール
- 決済確認メール
- 発送通知メール
- 配達完了通知

### 🔄 高度な機能
- 商品レビュー・評価システム
- クーポン・割引機能
- 配送料計算の詳細化
- 商品画像アップロード機能
- 多言語対応

## 技術詳細

### バックエンド
- **フレームワーク**: Hono（軽量・高速）
- **データベース**: Cloudflare D1（SQLite ベース）
- **認証**: JWT トークン
- **パスワード**: SHA-256 ハッシュ化（本番では bcrypt 推奨）

### フロントエンド
- **CSS フレームワーク**: TailwindCSS（CDN）
- **アイコン**: FontAwesome
- **HTTP クライアント**: Axios
- **UI**: バニラ JavaScript（SPA風の動作）

### デプロイメント
- **プラットフォーム**: Cloudflare Pages
- **エッジランタイム**: Cloudflare Workers
- **ビルドツール**: Vite
- **設定管理**: wrangler.jsonc

## ローカル開発

### 依存関係インストール
```bash
npm install
```

### データベース初期化
```bash
npm run db:migrate:local  # マイグレーション適用
npm run db:seed          # サンプルデータ投入
```

### 開発サーバー起動
```bash
npm run build           # ビルド（初回必須）
npm run dev:d1          # D1データベース付きで起動
```

### その他のコマンド
```bash
npm run test            # API テスト
npm run clean-port      # ポート3000をクリア
npm run db:console:local # ローカルDBコンソール
npm run git:status      # Git ステータス確認
```

## 🚀 独自ドメイン対応 & 本格デプロイ

### デプロイ手順
詳細な手順は `DEPLOYMENT_GUIDE.md` を参照してください。

1. **独自ドメイン取得** - お好みのドメイン名を取得
2. **Cloudflareアカウント作成** - DNS & Pages管理
3. **GitHubリポジトリ作成** - コード管理
4. **D1データベース作成** - 本番用データベース
5. **Cloudflare Pages設定** - 自動デプロイ設定
6. **カスタムドメイン設定** - SSL/TLS設定
7. **本番デプロイ** - 🎉

### 本番デプロイコマンド
```bash
# 本番用データベース作成
npx wrangler d1 create yoursite-production

# 本番デプロイ実行
npm run deploy:production

# カスタムドメイン追加
npm run domain:add yoursite.com --project-name webapp
```

## 推奨する次の開発ステップ

1. **決済システムの統合** - PayPay、Stripe等のAPI連携
2. **管理者ダッシュボード** - 商品・注文・在庫の管理画面
3. **メール通知** - SendGrid等を使用した自動メール送信
4. **商品画像管理** - Cloudflare R2を使用した画像アップロード
5. **SEO最適化** - メタタグ、構造化データ対応

## セキュリティ対策
- JWT トークンによる認証
- SQLインジェクション対策（Prepared Statements）
- CORS 設定
- パスワードハッシュ化
- 入力値バリデーション

## パフォーマンス
- Cloudflare エッジネットワーク活用
- SQLite データベースの軽量性
- 静的アセットのCDN配信
- レスポンシブイメージ対応