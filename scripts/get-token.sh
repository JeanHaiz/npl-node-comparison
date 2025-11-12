#!/bin/bash

# Script to get JWT token from Keycloak
# Usage: ./scripts/get-token.sh [username] [password]

USERNAME=${1:-testuser}
PASSWORD=${2:-testpass}
CLIENT_ID=${KEYCLOAK_CLIENT_ID:-node-api-client}
CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET:-your-client-secret}
KEYCLOAK_URL=${KEYCLOAK_URL:-http://localhost:11000}
REALM=${KEYCLOAK_REALM:-master}

echo "Getting token for user: $USERNAME"
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Realm: $REALM"
echo "Client ID: $CLIENT_ID"
echo ""

RESPONSE=$(curl -s -X POST "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "username=${USERNAME}" \
  -d "password=${PASSWORD}" \
  -d 'grant_type=password')

# Check if jq is available
if command -v jq &> /dev/null; then
  ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')

  if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
    echo "Access Token:"
    echo "$ACCESS_TOKEN"
    echo ""
    echo "Export to environment:"
    echo "export TOKEN='$ACCESS_TOKEN'"
  else
    echo "Failed to get token. Response:"
    echo $RESPONSE | jq '.'
  fi
else
  echo "Response:"
  echo $RESPONSE
  echo ""
  echo "Tip: Install 'jq' for better output formatting"
fi
