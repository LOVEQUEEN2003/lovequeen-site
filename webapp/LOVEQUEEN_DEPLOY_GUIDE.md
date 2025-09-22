# 🌸 LoveQueen ECサイト - lovequeen.co.jp デプロイガイド

## 🎯 最終目標
`https://lovequeen.co.jp` でECサイトを公開する

---

## 📋 **必要な作業（順番通り実行）**

### ステップ1: GitHubリポジトリ作成 ✅ 要実行

1. **GitHubアカウント作成**（未作成の場合）
   - [GitHub.com](https://github.com) でアカウント作成

2. **新しいリポジトリ作成**
   - [github.com/new](https://github.com/new) にアクセス
   - リポジトリ名: `lovequeen-ec-site`
   - Public に設定
   - 「Initialize this repository with a README」はチェックしない
   - 「Create repository」をクリック

3. **リポジトリURLをメモ**
   - 例: `https://github.com/YOUR_USERNAME/lovequeen-ec-site.git`

### ステップ2: Cloudflareアカウント設定 ✅ 要実行

1. **Cloudflareアカウント作成**
   - [Cloudflare.com](https://cloudflare.com) で無料アカウント作成

2. **ドメイン追加**
   - Cloudflare Dashboard → 「サイトを追加」
   - `lovequeen.co.jp` を入力
   - 無料プランを選択

3. **ネームサーバー変更**
   - Cloudflareから提供されるネームサーバーを確認
   - ドメイン管理会社（お名前.com等）でネームサーバーを変更
   - DNS伝播まで待機（最大24時間）

### ステップ3: ソースコードをGitHubにアップロード ✅ 要実行

**以下のコマンドを実行:**
```bash
cd /home/user/webapp

# GitHubリモート設定（YOUR_USERNAMEを実際のユーザー名に変更）
git remote add origin https://github.com/YOUR_USERNAME/lovequeen-ec-site.git

# コードをプッシュ
git add .
git commit -m "LoveQueen ECサイト - 初期デプロイ準備完了"
git branch -M main
git push -u origin main
```

### ステップ4: Cloudflare D1データベース作成 ✅ 要実行

```bash
# 本番用データベース作成
npx wrangler d1 create lovequeen-production

# 出力されるdatabase_idをコピーして、wrangler.jsonc を更新
```

**wrangler.jsonc を更新:**
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "lovequeen-co-jp",
  "compatibility_date": "2025-09-21", 
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "lovequeen-production",
      "database_id": "実際のdatabase_idに置き換え"
    }
  ]
}
```

### ステップ5: Cloudflare Pages設定 ✅ 要実行

1. **Cloudflare Dashboard** → **Pages** → **プロジェクトを作成**
2. **GitHubに接続** → `lovequeen-ec-site` リポジトリを選択
3. **ビルド設定:**
   ```
   Project name: lovequeen-co-jp
   Production branch: main
   Framework preset: Hono
   Build command: npm run build
   Build output directory: dist
   Root directory: (空白)
   ```
4. **「保存してデプロイ」**をクリック

### ステップ6: データベース初期化 ✅ 要実行

```bash
# 本番データベースにマイグレーション適用
npx wrangler d1 migrations apply lovequeen-production --remote

# サンプルデータ投入
npx wrangler d1 execute lovequeen-production --remote --file=./seed.sql
```

### ステップ7: カスタムドメイン設定 ✅ 要実行

1. **Cloudflare Pages** → **lovequeen-co-jp プロジェクト** → **カスタムドメイン**
2. **「ドメインを追加」**をクリック
3. `lovequeen.co.jp` を入力
4. **「ドメインをアクティブ化」**をクリック
5. SSL証明書が自動発行される（数分待機）

---

## 🎉 **完了！**

すべてのステップ完了後、以下のURLでアクセス可能：

- **メインサイト**: `https://lovequeen.co.jp`
- **バックアップURL**: `https://lovequeen-co-jp.pages.dev`

---

## ⚡ **クイックデプロイコマンド**

全ての設定完了後、今後のデプロイは簡単：

```bash
# コード更新後
git add .
git commit -m "機能追加: 新機能実装"
git push origin main

# 自動デプロイされます（GitHub連携により）

# 手動デプロイする場合
npm run deploy:production
```

---

## 🔧 **トラブルシューティング**

### DNS設定確認
```bash
nslookup lovequeen.co.jp
dig lovequeen.co.jp
```

### ビルド確認
```bash
npm run build
npm run preview
```

### データベース接続確認
```bash
npx wrangler d1 execute lovequeen-production --remote --command="SELECT COUNT(*) FROM products"
```

---

## 📞 **次のステップ**

公開後に追加できる機能：
1. **決済システム** - Stripe, PayPay 連携
2. **メール通知** - 注文確認メール送信
3. **管理者ダッシュボード** - 商品・注文管理
4. **SEO最適化** - Google Analytics設定
5. **PWA対応** - モバイルアプリ化

---

## 💡 **重要なポイント**

- ✅ コードは既にlovequeen.co.jp向けに最適化済み
- ✅ 商品データ、カート、注文システム実装済み
- ✅ SNS連携機能実装済み
- ✅ レスポンシブデザイン対応済み
- ✅ セキュリティ対策実装済み

**`https://lovequeen.co.jp` で本格的なECサイトが運営できます！**