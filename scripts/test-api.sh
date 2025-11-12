#!/bin/bash

# Script to test the API endpoints
# Usage: ./scripts/test-api.sh [token]

API_URL=${API_URL:-http://localhost:3000}
TOKEN=${1:-$TOKEN}

if [ -z "$TOKEN" ]; then
  echo "Error: No token provided"
  echo "Usage: ./scripts/test-api.sh [token]"
  echo "Or set TOKEN environment variable: export TOKEN='your-token'"
  exit 1
fi

echo "Testing API at: $API_URL"
echo ""

# Health check
echo "1. Health Check (no auth required):"
curl -s "${API_URL}/health" | jq '.'
echo ""

# Create a task
echo "2. Creating a task:"
TASK_RESPONSE=$(curl -s -X POST "${API_URL}/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Test Task",
    "description": "This is a test task created by the test script",
    "status": "TODO",
    "priority": "HIGH"
  }')

echo $TASK_RESPONSE | jq '.'
TASK_ID=$(echo $TASK_RESPONSE | jq -r '.id')
echo ""

if [ "$TASK_ID" != "null" ] && [ -n "$TASK_ID" ]; then
  # Get the task
  echo "3. Getting task by ID ($TASK_ID):"
  curl -s "${API_URL}/api/tasks/${TASK_ID}" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""

  # Update the task
  echo "4. Updating task:"
  curl -s -X PUT "${API_URL}/api/tasks/${TASK_ID}" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{
      "title": "Updated Test Task",
      "status": "IN_PROGRESS"
    }' | jq '.'
  echo ""

  # Get all tasks
  echo "5. Getting all tasks (paginated):"
  curl -s "${API_URL}/api/tasks?page=1&limit=5" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""

  # Delete the task
  echo "6. Deleting task:"
  curl -s -X DELETE "${API_URL}/api/tasks/${TASK_ID}" \
    -H "Authorization: Bearer $TOKEN"
  echo "Task deleted"
  echo ""

  # Restore the task
  echo "7. Restoring task:"
  curl -s -X POST "${API_URL}/api/tasks/${TASK_ID}/restore" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""
else
  echo "Failed to create task. Check your authentication."
fi
