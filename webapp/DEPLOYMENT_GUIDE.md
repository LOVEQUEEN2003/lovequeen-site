# ECサイト - 独自ドメイン対応 & Cloudflare Pages デプロイガイド

## 🌐 独自ドメイン + Cloudflare Pages デプロイ手順

このガイドでは、ECサイトを独自ドメインでCloudflare Pagesにデプロイする方法を説明します。

### 📋 前提条件

1. **独自ドメイン**を取得済み（例: `myecstore.com`）
2. **Cloudflareアカウント**を作成済み
3. **GitHubアカウント**を作成済み

---

## ステップ 1: Cloudflare アカウント設定

### 1.1 Cloudflareにドメイン追加
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 「サイトを追加」をクリック
3. ドメイン名を入力（例: `myecstore.com`）
4. 無料プランを選択
5. DNS設定を確認・調整

### 1.2 ネームサーバー変更
1. Cloudflareが提供するネームサーバーをコピー
2. ドメイン登録事業者の管理画面でネームサーバーを変更
3. DNS伝播完了まで待機（最大24時間）

---

## ステップ 2: GitHub リポジトリ準備

### 2.1 リポジトリ作成
```bash
# GitHubで新しいリポジトリを作成（例: myecstore-app）
# リポジトリ名は分かりやすい名前に変更してください
```

### 2.2 リモートリポジトリ設定
```bash
cd /home/user/webapp
git remote add origin https://github.com/YOUR_USERNAME/myecstore-app.git
git branch -M main
git push -u origin main
```

---

## ステップ 3: Cloudflare D1 データベース作成

### 3.1 本番用データベース作成
```bash
# 本番用D1データベース作成
npx wrangler d1 create myecstore-production

# 出力されたdatabase_idをコピーして、wrangler.jsonc を更新
```

### 3.2 wrangler.jsonc 更新
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "myecstore",
  "compatibility_date": "2025-09-21",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "myecstore-production",
      "database_id": "YOUR_ACTUAL_DATABASE_ID_HERE"  // 実際のIDに置き換え
    }
  ]
}
```

### 3.3 本番データベース初期化
```bash
# 本番DBにマイグレーション適用
npx wrangler d1 migrations apply myecstore-production --remote

# 本番DBにサンプルデータ投入
npx wrangler d1 execute myecstore-production --remote --file=./seed.sql
```

---

## ステップ 4: Cloudflare Pages 設定

### 4.1 Pagesプロジェクト作成
```bash
# Cloudflare APIトークン設定（Deploy タブで取得）
export CLOUDFLARE_API_TOKEN="your_api_token_here"

# Pagesプロジェクト作成
npx wrangler pages project create myecstore --production-branch main
```

### 4.2 GitHub連携設定
1. [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages) にアクセス
2. 作成したプロジェクトを選択
3. 「Settings」→「Git」で GitHubリポジトリを連携
4. ビルド設定を確認：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`

### 4.3 環境変数設定（必要に応じて）
```bash
# 例：外部API用のシークレット設定
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name myecstore
npx wrangler pages secret put SENDGRID_API_KEY --project-name myecstore
```

---

## ステップ 5: カスタムドメイン設定

### 5.1 カスタムドメイン追加
```bash
# メインドメインを設定
npx wrangler pages domain add myecstore.com --project-name myecstore

# サブドメインも設定する場合
npx wrangler pages domain add www.myecstore.com --project-name myecstore
```

### 5.2 DNS設定確認
Cloudflare Dashboardで以下のDNSレコードが自動作成されることを確認：
```
Type: CNAME
Name: myecstore.com
Target: myecstore.pages.dev
```

### 5.3 SSL/TLS設定
1. Cloudflare Dashboard → SSL/TLS
2. 暗号化モード：「Full (strict)」を選択
3. 「Always Use HTTPS」を有効化
4. 「Automatic HTTPS Rewrites」を有効化

---

## ステップ 6: デプロイメント

### 6.1 本番デプロイ
```bash
# プロジェクトビルド
npm run build

# Cloudflare Pagesにデプロイ
npx wrangler pages deploy dist --project-name myecstore

# 成功すると以下のURLが表示されます：
# ✅ https://myecstore.com
# ✅ https://myecstore.pages.dev
```

### 6.2 継続的デプロイメント設定
GitHub連携により、`main`ブランチへのpush時に自動デプロイされます：

```bash
# コード更新後
git add .
git commit -m "機能追加: 新機能実装"
git push origin main

# 自動的にCloudflare Pagesでビルド・デプロイが実行されます
```

---

## ステップ 7: 動作確認

### 7.1 基本動作テスト
1. `https://yoursite.com` にアクセス
2. ユーザー登録・ログインをテスト
3. 商品一覧・カート機能をテスト
4. 注文作成をテスト
5. SNSシェア機能をテスト

### 7.2 パフォーマンス確認
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

---

## 🔧 トラブルシューティング

### ドメイン接続エラー
```bash
# DNS伝播状況確認
nslookup yoursite.com

# Cloudflareプロキシ状況確認
dig yoursite.com
```

### ビルドエラー
```bash
# ローカルでビルドテスト
npm run build

# 依存関係の問題
npm clean-install
```

### データベース接続エラー
```bash
# 本番DB接続テスト
npx wrangler d1 execute myecstore-production --remote --command="SELECT COUNT(*) FROM users"

# マイグレーション状態確認
npx wrangler d1 migrations list myecstore-production --remote
```

---

## 📈 本番運用のベストプラクティス

### セキュリティ
- 定期的なセキュリティ更新
- 環境変数での機密情報管理
- HTTPS強制リダイレクト設定

### パフォーマンス
- Cloudflareキャッシュ設定最適化
- 画像最適化（Cloudflare Images）
- CDN設定の調整

### 監視・分析
- Cloudflare Analytics設定
- Google Analytics導入
- エラーログ監視

### バックアップ
- D1データベースの定期バックアップ
- コードのGitリポジトリ管理
- 設定ファイルのバージョン管理

---

## 🚀 次のステップ

1. **決済システム統合** - Stripe, PayPay などの決済機能
2. **管理者ダッシュボード** - 商品・注文管理機能
3. **メール通知システム** - SendGrid との連携
4. **SEO最適化** - メタタグ、構造化データ
5. **PWA対応** - オフライン機能、プッシュ通知

---

## 💡 参考リンク

- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/)
- [Wrangler CLI ドキュメント](https://developers.cloudflare.com/workers/wrangler/)
- [Hono フレームワーク](https://hono.dev/)

---

**注意**: このガイドの`myecstore`部分は、実際のプロジェクト名に置き換えてください。