#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-status}"
AWS_PROFILE_NAME="${2:-bruno}"
FUNCTION_NAME="aee-digital-api"
ALIAS_NAME="live"
REGION="us-east-1"
EXPECTED_ACCOUNT="115186094843"
export AWS_PROFILE="$AWS_PROFILE_NAME"

[[ "$ACTION" =~ ^(enable|disable|status)$ ]] || { echo "Uso: $0 <enable|disable|status> [aws-profile]" >&2; exit 2; }
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
[[ "$ACCOUNT" == "$EXPECTED_ACCOUNT" ]] || { echo "Conta AWS incorreta: $ACCOUNT" >&2; exit 1; }

ALIAS_VERSION="$(aws lambda get-alias --function-name "$FUNCTION_NAME" --name "$ALIAS_NAME" --region "$REGION" --query 'FunctionVersion' --output text)"
CURRENT_CONFIG="$(aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --qualifier "$ALIAS_VERSION" --region "$REGION" --output json)"
CURRENT="$(jq '.Environment.Variables // {}' <<<"$CURRENT_CONFIG")"
if [[ "$ACTION" == "status" ]]; then
  STATE="$(jq -r 'if .ANSWERS_WRITE_DISABLED == "true" then "disabled" else "enabled" end' <<<"$CURRENT")"
  echo "$STATE (alias $ALIAS_NAME -> versão $ALIAS_VERSION)"
  exit 0
fi

LATEST_SHA="$(aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --region "$REGION" --query 'CodeSha256' --output text)"
ALIAS_SHA="$(jq -r '.CodeSha256' <<<"$CURRENT_CONFIG")"
[[ "$LATEST_SHA" == "$ALIAS_SHA" ]] || {
  echo "Código de \$LATEST difere do alias $ALIAS_NAME; faça deploy antes da manutenção." >&2
  exit 1
}

VALUE="false"
[[ "$ACTION" == "disable" ]] && VALUE="true"
UPDATED="$(jq --arg value "$VALUE" '. + {ANSWERS_WRITE_DISABLED: $value}' <<<"$CURRENT")"
ENVIRONMENT_PAYLOAD="$(jq -cn --argjson variables "$UPDATED" '{Variables:$variables}')"
aws lambda update-function-configuration --function-name "$FUNCTION_NAME" --region "$REGION" \
  --environment "$ENVIRONMENT_PAYLOAD" --query 'LastUpdateStatus' --output text >/dev/null
aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"
NEW_VERSION="$(aws lambda publish-version --function-name "$FUNCTION_NAME" --region "$REGION" \
  --description "Answers maintenance $ACTION $(date -u +%Y-%m-%dT%H:%M:%SZ)" --query 'Version' --output text)"
aws lambda update-alias --function-name "$FUNCTION_NAME" --name "$ALIAS_NAME" --region "$REGION" \
  --function-version "$NEW_VERSION" --query 'FunctionVersion' --output text >/dev/null
echo "Answers writes: $([[ "$VALUE" == "true" ]] && echo disabled || echo enabled) (alias $ALIAS_NAME: $ALIAS_VERSION -> $NEW_VERSION)"
