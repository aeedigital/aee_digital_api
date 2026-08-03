#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/.lambda_build"
ZIP_PATH="$ROOT_DIR/dist.zip"
INFRA_DIR="$ROOT_DIR/infra"
RELEASE_DIR="$ROOT_DIR/.deploy-releases"
DEFAULT_AWS_PROFILE="bruno"
EXPECTED_AWS_ACCOUNT_ID="115186094843"
DEPLOY_AWS_PROFILE="${1:-${AWS_PROFILE:-$DEFAULT_AWS_PROFILE}}"

if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [aws-profile]" >&2
  exit 2
fi

export AWS_PROFILE="$DEPLOY_AWS_PROFILE"

echo "==> Validate AWS credentials"
if ! CURRENT_AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"; then
  echo "Unable to authenticate with AWS profile '$DEPLOY_AWS_PROFILE'." >&2
  echo "Check the profile credentials and the system clock before retrying." >&2
  exit 1
fi

if [[ "$CURRENT_AWS_ACCOUNT_ID" != "$EXPECTED_AWS_ACCOUNT_ID" ]]; then
  echo "Refusing deploy to AWS account '$CURRENT_AWS_ACCOUNT_ID'." >&2
  echo "Expected account: '$EXPECTED_AWS_ACCOUNT_ID'." >&2
  exit 1
fi

echo "==> AWS profile '$DEPLOY_AWS_PROFILE' authenticated in account '$CURRENT_AWS_ACCOUNT_ID'"

mkdir -p "$RELEASE_DIR"
RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)"
PREVIOUS_VERSION="$(aws lambda get-alias --function-name aee-digital-api --name live --region us-east-1 --query FunctionVersion --output text 2>/dev/null || true)"
if [[ -z "$PREVIOUS_VERSION" ]]; then
  echo "==> Publish current production code as the initial rollback version"
  PREVIOUS_VERSION="$(aws lambda publish-version --function-name aee-digital-api --region us-east-1 --description "Pre-alias rollback $RELEASE_ID" --query Version --output text)"
fi
ANSWERS_WRITE_DISABLED="$(aws lambda get-function-configuration --function-name aee-digital-api \
  --qualifier "$PREVIOUS_VERSION" --region us-east-1 --query 'Environment.Variables.ANSWERS_WRITE_DISABLED' --output text 2>/dev/null || true)"
[[ "$ANSWERS_WRITE_DISABLED" == "true" ]] || ANSWERS_WRITE_DISABLED="false"
echo "==> Answers maintenance flag preserved as '$ANSWERS_WRITE_DISABLED'"

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
terraform init -input=false
terraform apply -input=false -auto-approve -var-file="terraform.tfvars" \
  -var="answers_write_disabled=$ANSWERS_WRITE_DISABLED"

CURRENT_VERSION="$(aws lambda get-alias --function-name aee-digital-api --name live --region us-east-1 --query FunctionVersion --output text)"
ARTIFACT_SHA256="$(shasum -a 256 "$ZIP_PATH" | awk '{print $1}')"
MANIFEST_PATH="$RELEASE_DIR/api-$RELEASE_ID.json"
cat > "$MANIFEST_PATH" <<EOF
{
  "releaseId": "$RELEASE_ID",
  "accountId": "$CURRENT_AWS_ACCOUNT_ID",
  "profile": "$DEPLOY_AWS_PROFILE",
  "function": "aee-digital-api",
  "alias": "live",
  "previousVersion": "$PREVIOUS_VERSION",
  "currentVersion": "$CURRENT_VERSION",
  "artifactSha256": "$ARTIFACT_SHA256",
  "rollback": "aws --profile $DEPLOY_AWS_PROFILE lambda update-alias --function-name aee-digital-api --name live --function-version $PREVIOUS_VERSION --region us-east-1"
}
EOF

echo "==> Release manifest: $MANIFEST_PATH"

echo "Done."
