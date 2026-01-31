#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/.lambda_build"
ZIP_PATH="$ROOT_DIR/dist.zip"
INFRA_DIR="$ROOT_DIR/infra"

echo "==> Build Nest project"
cd "$ROOT_DIR"
npm ci
npm run build

echo "==> Prepare staging dir $BUILD_DIR"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

cp "$ROOT_DIR/package.json" "$ROOT_DIR/package-lock.json" "$BUILD_DIR/"
cp -R "$ROOT_DIR/dist" "$BUILD_DIR/dist"

echo "==> Install production deps for Lambda"
npm ci --omit=dev --prefix "$BUILD_DIR"

echo "==> Zip artifact to $ZIP_PATH"
rm -f "$ZIP_PATH"
(cd "$BUILD_DIR" && zip -r "$ZIP_PATH" dist node_modules package.json package-lock.json > /dev/null)

echo "==> Run Terraform"
cd "$INFRA_DIR"
terraform init
terraform apply -auto-approve -var-file="terraform.tfvars"

echo "Done."
