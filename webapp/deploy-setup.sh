#!/bin/bash

# ECサイト デプロイ設定スクリプト

echo "🚀 ECサイト デプロイ準備スクリプト"
echo "================================"

# ユーザー入力
read -p "GitHubユーザー名を入力してください: " GITHUB_USERNAME
read -p "リポジトリ名を入力してください: " REPO_NAME
read -p "独自ドメイン名を入力してください (例: myshop.com): " DOMAIN_NAME

echo ""
echo "設定内容:"
echo "GitHub: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
echo "ドメイン: ${DOMAIN_NAME}"
echo ""

read -p "この設定で進めますか？ (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "キャンセルしました。"
    exit 1
fi

echo ""
echo "🔧 Git設定を更新中..."

# Git リモート設定
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

# wrangler.jsonc のプロジェクト名更新
sed -i "s/\"name\": \"webapp\"/\"name\": \"${REPO_NAME}\"/" wrangler.jsonc

# package.json のプロジェクト名更新
sed -i "s/\"name\": \"webapp\"/\"name\": \"${REPO_NAME}\"/" package.json

echo "✅ 設定完了！"
echo ""
echo "📋 次のステップ:"
echo "1. GitHub リポジトリが作成済みか確認"
echo "2. 以下のコマンドでコードをプッシュ:"
echo "   git add ."
echo "   git commit -m 'Initial deployment setup'"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Cloudflare Pages でリポジトリを接続"
echo "4. カスタムドメイン ${DOMAIN_NAME} を設定"
echo ""
echo "詳細は QUICK_DEPLOY_GUIDE.md を参照してください。"