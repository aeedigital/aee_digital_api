#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR=""
ZIP_PATH="$ROOT_DIR/dist.zip"
INFRA_DIR="$ROOT_DIR/infra"
EXPECTED_AWS_ACCOUNT_ID="115186094843"
AWS_REGION="${AWS_REGION:-us-east-1}"
DEFAULT_AWS_PROFILE="bruno"
API_FUNCTION_NAME="${DEPLOY_API_FUNCTION_NAME:-aee-digital-api}"
WORKER_FUNCTION_NAME="${DEPLOY_WORKER_FUNCTION_NAME:-aee-digital-summary-center-refresh-worker}"
MODE="${1:-plan}"
TARGET="infrastructure"
PLAN_FILE=""
CONFIRM_ACCOUNT=""
PROFILE="${AWS_PROFILE:-$DEFAULT_AWS_PROFILE}"
ENABLE_REFRESH="false"
ROLLBACK_TARGET=""
ROLLBACK_VERSION=""

cleanup_build_dir() {
  if [[ -n "$BUILD_DIR" ]]; then
    rm -rf -- "$BUILD_DIR"
  fi
}

trap cleanup_build_dir EXIT

usage() {
  cat <<EOF
Usage:
  $0 [plan] [--target infrastructure|candidate|promotion] [--enable-refresh] [--profile NAME]
  $0 apply PLAN_FILE --confirm-account ACCOUNT_ID [--profile NAME]
  $0 candidate PLAN_FILE --confirm-account ACCOUNT_ID [--profile NAME]
  $0 promote PLAN_FILE --confirm-account ACCOUNT_ID [--profile NAME]
  $0 rollback api|worker VERSION --confirm-account ACCOUNT_ID [--profile NAME]

Plans are written outside the repository. Mutating modes require an approved
account confirmation and a plan produced by this script.
EOF
}

redact_sensitive_values() {
  sed -E '/^[[:space:]]*[-+~]?[[:space:]]*"[^"]*(PASSWORD|TOKEN|SECRET|KEY|URI|CREDENTIAL)[^"]*"[[:space:]]*=/s/[[:space:]]*=[[:space:]]*.*/ = "<redacted>"/'
}

if [[ "$MODE" == --help || "$MODE" == -h ]]; then
  usage
  exit 0
fi

case "$MODE" in
  plan|apply|candidate|promote|rollback) shift || true ;;
  *)
    echo "Unknown deployment mode: $MODE" >&2
    usage >&2
    exit 2
    ;;
esac

if [[ "$MODE" == apply || "$MODE" == candidate || "$MODE" == promote ]]; then
  if [[ $# -lt 1 ]]; then
    echo "$MODE requires a Terraform plan file." >&2
    usage >&2
    exit 2
  fi
  PLAN_FILE="$1"
  shift
elif [[ "$MODE" == rollback ]]; then
  if [[ $# -lt 2 ]]; then
    echo "rollback requires a target and version." >&2
    usage >&2
    exit 2
  fi
  ROLLBACK_TARGET="$1"
  ROLLBACK_VERSION="$2"
  shift 2
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      [[ $# -ge 2 ]] || { echo "--profile requires a value." >&2; exit 2; }
      PROFILE="$2"
      shift 2
      ;;
    --confirm-account)
      [[ $# -ge 2 ]] || { echo "--confirm-account requires an account ID." >&2; exit 2; }
      CONFIRM_ACCOUNT="$2"
      shift 2
      ;;
    --target)
      [[ $# -ge 2 ]] || { echo "--target requires a value." >&2; exit 2; }
      TARGET="$2"
      shift 2
      ;;
    --enable-refresh)
      ENABLE_REFRESH="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$MODE" == plan ]]; then
  case "$TARGET" in
    infrastructure|candidate|promotion) ;;
    *)
      echo "Unsupported plan target: $TARGET" >&2
      exit 2
      ;;
  esac
  if [[ "$ENABLE_REFRESH" == "true" && "$TARGET" != "promotion" ]]; then
    echo "--enable-refresh is allowed only for a promotion plan." >&2
    exit 2
  fi
elif [[ "$MODE" == rollback ]]; then
  if [[ "$ROLLBACK_TARGET" != "api" && "$ROLLBACK_TARGET" != "worker" ]]; then
    echo "Rollback target must be 'api' or 'worker'." >&2
    exit 2
  fi
  if [[ ! "$ROLLBACK_VERSION" =~ ^[1-9][0-9]*$ ]]; then
    echo "Rollback version must be a published numeric Lambda version." >&2
    exit 2
  fi
fi

export AWS_PROFILE="$PROFILE"

require_account_confirmation() {
  if [[ "$CONFIRM_ACCOUNT" != "$EXPECTED_AWS_ACCOUNT_ID" ]]; then
    echo "Mutation requires --confirm-account $EXPECTED_AWS_ACCOUNT_ID." >&2
    exit 2
  fi
}

check_aws_account() {
  echo "==> Validate AWS credentials and target account"
  local current_account
  if ! current_account="$(aws sts get-caller-identity --query Account --output text)"; then
    echo "Unable to authenticate with AWS profile '$PROFILE'." >&2
    exit 1
  fi
  if [[ "$current_account" != "$EXPECTED_AWS_ACCOUNT_ID" ]]; then
    echo "Refusing operation in AWS account '$current_account'; expected '$EXPECTED_AWS_ACCOUNT_ID'." >&2
    exit 1
  fi
  echo "==> AWS profile '$PROFILE' authenticated in approved account '$current_account'"
}

build_artifact() {
  echo "==> Build Nest project"
  cd "$ROOT_DIR"
  npm ci
  npm run build

  echo "==> Prepare private Lambda staging directory"
  BUILD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/aee-digital-lambda-build.XXXXXX")"
  chmod 700 "$BUILD_DIR"
  cp "$ROOT_DIR/package.json" "$ROOT_DIR/package-lock.json" "$BUILD_DIR/"
  cp -R "$ROOT_DIR/dist" "$BUILD_DIR/dist"

  echo "==> Install production dependencies for Lambda"
  npm ci --omit=dev --prefix "$BUILD_DIR"

  echo "==> Package Lambda artifact"
  rm -f "$ZIP_PATH"
  (cd "$BUILD_DIR" && zip -r "$ZIP_PATH" dist node_modules package.json package-lock.json > /dev/null)
}

create_plan() {
  local plan_dir plan_timestamp refresh_value api_version_alias worker_version_alias api_plan_version worker_plan_version
  local -a version_args
  plan_dir="$(mktemp -d "${TMPDIR:-/tmp}/aee-digital-api-plan.XXXXXX")"
  chmod 700 "$plan_dir"
  plan_timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  PLAN_FILE="$plan_dir/${TARGET}-${plan_timestamp}.tfplan"
  refresh_value="false"
  [[ "$ENABLE_REFRESH" == "true" ]] && refresh_value="true"

  api_version_alias="live"
  worker_version_alias="live"
  if [[ "$TARGET" == "promotion" ]]; then
    api_version_alias="candidate"
    worker_version_alias="candidate"
  fi

  api_plan_version="$(aws lambda get-alias \
    --function-name "$API_FUNCTION_NAME" \
    --name "$api_version_alias" \
    --region "$AWS_REGION" \
    --query FunctionVersion \
    --output text)"
  if [[ ! "$api_plan_version" =~ ^[1-9][0-9]*$ ]]; then
    echo "AWS returned an invalid $api_version_alias API alias version." >&2
    exit 1
  fi

  worker_plan_version=""
  if worker_plan_version="$(aws lambda get-alias \
    --function-name "$WORKER_FUNCTION_NAME" \
    --name "$worker_version_alias" \
    --region "$AWS_REGION" \
    --query FunctionVersion \
    --output text 2>&1)"; then
    if [[ ! "$worker_plan_version" =~ ^[1-9][0-9]*$ ]]; then
      echo "AWS returned an invalid $worker_version_alias worker alias version." >&2
      exit 1
    fi
  elif [[ "$TARGET" == "promotion" || "$worker_plan_version" != *"ResourceNotFoundException"* ]]; then
    echo "Unable to read the $worker_version_alias worker alias: $worker_plan_version" >&2
    exit 1
  else
    worker_plan_version=""
  fi

  version_args=(-var="api_live_version=$api_plan_version")
  if [[ -n "$worker_plan_version" ]]; then
    version_args+=(-var="worker_live_version=$worker_plan_version")
  fi

  cd "$INFRA_DIR"
  terraform init -input=false
  terraform plan \
    -no-color \
    -input=false \
    -var-file="terraform.tfvars" \
    "${version_args[@]}" \
    -var="summary_center_refresh_enabled=$refresh_value" \
    -out="$PLAN_FILE" 2>&1 |
    redact_sensitive_values

  chmod 600 "$PLAN_FILE"
  shasum -a 256 "$PLAN_FILE" | awk '{print $1}' > "$PLAN_FILE.sha256"
  shasum -a 256 "$ZIP_PATH" | awk '{print $1}' > "$PLAN_FILE.artifact.sha256"
  printf '%s\n' "$TARGET" > "$PLAN_FILE.target"
  chmod 600 "$PLAN_FILE.sha256" "$PLAN_FILE.artifact.sha256" "$PLAN_FILE.target"
  echo "==> Reviewed-plan artifact: $PLAN_FILE"
  echo "==> Target: $TARGET; summary refresh enabled: $refresh_value"
}

validate_plan() {
  local expected_target="$1"
  local canonical_plan
  if [[ ! -f "$PLAN_FILE" || ! -f "$PLAN_FILE.sha256" || ! -f "$PLAN_FILE.artifact.sha256" || ! -f "$PLAN_FILE.target" ]]; then
    echo "Plan or integrity metadata is missing; create a plan with this script first." >&2
    exit 1
  fi
  canonical_plan="$(cd "$(dirname "$PLAN_FILE")" && pwd -P)/$(basename "$PLAN_FILE")"
  case "$canonical_plan" in
    "$ROOT_DIR"/*)
      echo "Terraform plan files must remain outside the repository." >&2
      exit 1
      ;;
  esac
  if [[ "$(cat "$PLAN_FILE.target")" != "$expected_target" ]]; then
    echo "Plan target does not match '$expected_target' mode." >&2
    exit 1
  fi
  if [[ "$(shasum -a 256 "$PLAN_FILE" | awk '{print $1}')" != "$(cat "$PLAN_FILE.sha256")" ]]; then
    echo "Terraform plan changed after it was created." >&2
    exit 1
  fi
  if [[ ! -f "$ZIP_PATH" || "$(shasum -a 256 "$ZIP_PATH" | awk '{print $1}')" != "$(cat "$PLAN_FILE.artifact.sha256")" ]]; then
    echo "Lambda artifact changed after planning; create and review a new plan." >&2
    exit 1
  fi
}

apply_reviewed_plan() {
  local expected_target="$1"
  require_account_confirmation
  check_aws_account
  validate_plan "$expected_target"
  cd "$INFRA_DIR"
  terraform init -input=false
  terraform apply -no-color -input=false "$PLAN_FILE" 2>&1 | redact_sensitive_values
}

case "$MODE" in
  plan)
    check_aws_account
    build_artifact
    create_plan
    ;;
  apply)
    apply_reviewed_plan infrastructure
    ;;
  candidate)
    apply_reviewed_plan candidate
    ;;
  promote)
    apply_reviewed_plan promotion
    ;;
  rollback)
    require_account_confirmation
    check_aws_account
    if [[ "$ROLLBACK_TARGET" == "api" ]]; then
      function_name="$API_FUNCTION_NAME"
    else
      function_name="$WORKER_FUNCTION_NAME"
    fi
    aws lambda update-alias \
      --function-name "$function_name" \
      --name live \
      --function-version "$ROLLBACK_VERSION" \
      --region "$AWS_REGION"
    ;;
esac
