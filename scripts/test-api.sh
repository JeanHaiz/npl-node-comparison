#!/bin/bash

# Script to test the HelloWorld API endpoints
# Usage: ./scripts/test-api.sh [token]

API_URL=${API_URL:-http://localhost:3000}
TOKEN=${1:-$TOKEN}

if [ -z "$TOKEN" ]; then
  echo "Error: No token provided"
  echo "Usage: ./scripts/test-api.sh [token]"
  echo "Or set TOKEN environment variable: export TOKEN='your-token'"
  exit 1
fi

echo "Testing HelloWorld API at: $API_URL"
echo ""

# Health check
echo "1. Health Check (no auth required):"
curl -s "${API_URL}/health" | jq '.'
echo ""

# Create a HelloWorld instance
echo "2. Creating a HelloWorld instance:"
HELLO_RESPONSE=$(curl -s -X POST "${API_URL}/api/hello-worlds" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "TestUser"
  }')

echo $HELLO_RESPONSE | jq '.'
HELLO_ID=$(echo $HELLO_RESPONSE | jq -r '.id')
echo ""

if [ "$HELLO_ID" != "null" ] && [ -n "$HELLO_ID" ]; then
  # Get the HelloWorld instance
  echo "3. Getting HelloWorld by ID ($HELLO_ID):"
  curl -s "${API_URL}/api/hello-worlds/${HELLO_ID}" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""

  # Say hello (first time - should work)
  echo "4. Saying hello (first time):"
  curl -s -X POST "${API_URL}/api/hello-worlds/${HELLO_ID}/say-hello" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""

  # Try to say hello again (should fail)
  echo "5. Trying to say hello again (should fail):"
  curl -s -X POST "${API_URL}/api/hello-worlds/${HELLO_ID}/say-hello" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""

  # Get all user's HelloWorld instances
  echo "6. Getting all user's HelloWorld instances:"
  curl -s "${API_URL}/api/hello-worlds" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""

  # Create another HelloWorld instance
  echo "7. Creating another HelloWorld instance:"
  HELLO_RESPONSE2=$(curl -s -X POST "${API_URL}/api/hello-worlds" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{
      "username": "AnotherUser"
    }')

  echo $HELLO_RESPONSE2 | jq '.'
  HELLO_ID2=$(echo $HELLO_RESPONSE2 | jq -r '.id')
  echo ""

  if [ "$HELLO_ID2" != "null" ] && [ -n "$HELLO_ID2" ]; then
    # Say hello with the new instance
    echo "8. Saying hello with the second HelloWorld instance:"
    curl -s -X POST "${API_URL}/api/hello-worlds/${HELLO_ID2}/say-hello" \
      -H "Authorization: Bearer $TOKEN" | jq '.'
    echo ""

    # Delete the second HelloWorld instance
    echo "9. Deleting second HelloWorld instance:"
    curl -s -X DELETE "${API_URL}/api/hello-worlds/${HELLO_ID2}" \
      -H "Authorization: Bearer $TOKEN"
    echo "HelloWorld deleted"
    echo ""
  fi

  # Delete the first HelloWorld instance
  echo "10. Deleting first HelloWorld instance:"
  curl -s -X DELETE "${API_URL}/api/hello-worlds/${HELLO_ID}" \
    -H "Authorization: Bearer $TOKEN"
  echo "HelloWorld deleted"
  echo ""

else
  echo "Failed to create HelloWorld instance. Check your authentication."
fi
