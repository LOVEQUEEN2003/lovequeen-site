# 🚀 ECサイト 独自ドメイン公開 - クイックガイド

## 前提条件
- 独自ドメインを取得済み（例: `yoursite.com`）
- GitHubアカウント作成済み
- Cloudflareアカウント作成済み

---

## 📱 **5分で完了！簡単公開手順**

### ステップ1: GitHubリポジトリ作成
1. [GitHub.com](https://github.com/new) で新規リポジトリ作成
2. リポジトリ名: `my-ec-site` (お好みの名前)
3. Public に設定
4. README等は追加しない

### ステップ2: コードをGitHubにアップロード

**ローカル環境で実行:**
```bash
cd /home/user/webapp
git remote add origin https://github.com/YOUR_USERNAME/my-ec-site.git
git branch -M main
git push -u origin main
```

### ステップ3: Cloudflareでドメイン追加
1. [Cloudflare Dashboard](https://dash.cloudflare.com) にログイン
2. 「サイトを追加」→ ドメイン名を入力
3. ネームサーバーをドメイン管理画面で変更
4. DNS設定完了まで待機（最大24時間）

### ステップ4: Cloudflare Pages設定
1. Cloudflare Dashboard → **Pages** → **プロジェクトを作成**
2. **GitHubに接続** → リポジトリを選択
3. **ビルド設定:**
   ```
   Framework preset: Hono
   Build command: npm run build
   Build output directory: dist
   Root directory: (空白)
   ```
4. **デプロイ**をクリック

### ステップ5: データベース作成
```bash
# 本番用D1データベース作成
npx wrangler d1 create yoursite-production

# 出力されるdatabase_idをコピー
# wrangler.jsonc の database_id を更新
```

### ステップ6: カスタムドメイン設定
1. Cloudflare Pages → あなたのプロジェクト → **カスタムドメイン**
2. **ドメインを追加** → `yoursite.com` を入力
3. 自動でDNSレコードが設定される
4. SSL証明書が自動発行される（数分）

### ステップ7: データベース初期化
```bash
# マイグレーション適用
npx wrangler d1 migrations apply yoursite-production --remote

# サンプルデータ投入
npx wrangler d1 execute yoursite-production --remote --file=./seed.sql
```

---

## 🎉 **完了！**

**あなたのECサイトのURL:**
- メインサイト: `https://yoursite.com`
- 管理URL: `https://yoursite-xyz.pages.dev` (バックアップ)

---

## ⚡ **さらに簡単な方法（上級者向け）**

全ての作業を自動化したい場合:

```bash
# 1. 環境設定
export GITHUB_USERNAME="your-username"
export REPO_NAME="my-ec-site"  
export DOMAIN_NAME="yoursite.com"

# 2. 自動デプロイスクリプト実行
./deploy-to-production.sh
```

---

## 🔧 **トラブルシューティング**

### ドメインが反映されない
```bash
# DNS確認
nslookup yoursite.com
dig yoursite.com
```

### ビルドエラー
```bash
# ローカルでテスト
npm run build
npm run preview
```

### データベース接続エラー
```bash
# DB接続確認
npx wrangler d1 execute yoursite-production --remote --command="SELECT 1"
```

---

## 📞 **サポート**

問題が発生した場合:
1. このファイルのトラブルシューティングを確認
2. DEPLOYMENT_GUIDE.md の詳細版を参照
3. Cloudflare/GitHub のドキュメントを確認

**成功した場合は `https://yoursite.com` でECサイトが表示されます！**