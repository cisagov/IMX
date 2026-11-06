#!/usr/bin/env sh
set -eu

# Required variables:
# - GHEC_APP_ID
# - GHEC_APP_INSTALLATION_ID
# - GHEC_APP_PRIVATE_KEY (path to PEM file from GitLab File variable)

required_vars="GHEC_APP_ID GHEC_APP_INSTALLATION_ID GHEC_APP_PRIVATE_KEY"
for var in $required_vars; do
  eval "val=\${$var:-}"
  if [ -z "$val" ]; then
    echo "Missing required variable: $var" >&2
    exit 1
  fi
done

if [ ! -f "$GHEC_APP_PRIVATE_KEY" ]; then
  echo "GHEC_APP_PRIVATE_KEY file not found at path: $GHEC_APP_PRIVATE_KEY" >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi

base64url() {
  openssl base64 -A | tr '+/' '-_' | tr -d '='
}

now_epoch=$(date +%s)
iat=$((now_epoch - 60))
exp=$((now_epoch + 540))

jwt_header='{"alg":"RS256","typ":"JWT"}'
jwt_payload=$(printf '{"iat":%s,"exp":%s,"iss":"%s"}' "$iat" "$exp" "$GHEC_APP_ID")

header_b64=$(printf '%s' "$jwt_header" | base64url)
payload_b64=$(printf '%s' "$jwt_payload" | base64url)
unsigned_token="${header_b64}.${payload_b64}"

signature_b64=$(printf '%s' "$unsigned_token" | \
  openssl dgst -sha256 -sign "$GHEC_APP_PRIVATE_KEY" | \
  base64url)

jwt="${unsigned_token}.${signature_b64}"

api_url="https://api.cisa.ghe.com/app/installations/${GHEC_APP_INSTALLATION_ID}/access_tokens"

response=$(curl --silent --show-error --fail-with-body \
  --request POST \
  --url "$api_url" \
  --header "Accept: application/vnd.github+json" \
  --header "Authorization: Bearer $jwt" \
  --header "X-GitHub-Api-Version: 2022-11-28")

token=$(printf '%s' "$response" | jq -r '.token')
if [ "$token" = "null" ] || [ -z "$token" ]; then
  echo "Failed to obtain GitHub App installation token" >&2
  exit 1
fi

printf '%s\n' "$token"
