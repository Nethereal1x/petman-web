#!/bin/bash
# Збирає сайт і публікує його в гілку gh-pages (GitHub Pages: https://<user>.github.io/<repo>/).
# Запуск: npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE=$(git remote get-url origin)
REPO=$(basename -s .git "$REMOTE")

PUBLIC_NOINDEX=1 npx astro build
BASE_PATH="/$REPO" node scripts/apply-base.mjs
touch dist/.nojekyll # інакше GitHub Pages сховає теку _astro

cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(git -C .. rev-parse --short HEAD)"
git push -q -f "$REMOTE" gh-pages
rm -rf .git
echo "Опубліковано: гілка gh-pages у $REPO"
