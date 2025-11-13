# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Start Infrastructure

```bash
# Start PostgreSQL and Keycloak
docker compose up -d

# Wait for services to be ready (30-60 seconds)
docker compose logs -f keycloak
# Press Ctrl+C when you see "Keycloak started"
```

## 3. Configure Keycloak

Open browser to http://localhost:11000

- Login with: `admin` / `admin`

### Create a Client:

1. Click "Clients" → "Create client"
2. Client ID: `node-api-client`
3. Click "Next"
4. Enable "Client authentication"
5. Click "Save"
6. Go to "Credentials" tab
7. Copy the "Client secret"
8. Update `.env` file: `KEYCLOAK_CLIENT_SECRET=<your-secret>`

### Create a User:

1. Click "Users" → "Create new user"
2. Username: `testuser`
3. Click "Create"
4. Go to "Credentials" tab
5. Click "Set password"
6. Password: `testpass`
7. Disable "Temporary"
8. Click "Save"

## 4. Start the API

```bash
npm run dev
```

You should see:

```
Server running on port 3000
API Documentation available at http://localhost:3000/api-docs
```

## 5. Test the API

### Get a JWT Token:

```bash
./scripts/get-token.sh testuser testpass
```

Copy the token and export it:

```bash
export TOKEN='<your-token>'
```

### Run API Tests:

```bash
./scripts/test-api.sh $TOKEN
```

Or manually test:

```bash
# Create a task
curl -X POST 'http://localhost:3000/api/tasks' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "My First Task",
    "description": "Getting started with the API",
    "priority": "HIGH"
  }'

# Get all tasks
curl 'http://localhost:3000/api/tasks' \
  -H "Authorization: Bearer $TOKEN"
```

### Use Swagger UI:

1. Open http://localhost:3000/api-docs
2. Click "Authorize"
3. Enter: `Bearer <your-token>`
4. Try the endpoints!

## 6. View Audit Logs

Connect to PostgreSQL:

```bash
docker exec -it node-api-postgres psql -U postgres -d node_api_db
```

Query audit logs:

```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

## What's Happening Behind the Scenes?

- JWT tokens are validated against Keycloak
- User context is automatically tracked
- All database operations run in transactions
- Changes are automatically rolled back on errors
- Audit logs are created for all CREATE/UPDATE/DELETE operations
- Entities include createdBy, updatedBy, createdAt, updatedAt fields

## Troubleshooting

### Can't get token?

- Check Keycloak is running: `docker-compose ps`
- Verify client secret in `.env` matches Keycloak
- Ensure user exists with correct password

### API returns 401?

- Token might be expired (valid for 5 minutes by default)
- Get a new token with `./scripts/get-token.sh`

### Database connection error?

- Check PostgreSQL is running: `docker-compose ps`
- Verify credentials in `.env` match docker-compose.yml

## Next Steps

- Read the full README.md
- Create your own entities (see "Creating New Entities" in README)
- Add custom business logic
- Deploy to production

## Architecture Overview

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ JWT Token
       ▼
┌─────────────────────────┐
│   Express Middleware    │
│  - Auth (Keycloak)      │
│  - Context              │
│  - Error Handling       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│   Controllers/Routes    │
│  - Validation           │
│  - Request/Response     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│   Services (Business)   │
│  - Transaction Mgmt     │
│  - Business Logic       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│   TypeORM/PostgreSQL    │
│  - Persistence          │
│  - Audit Logging        │
└─────────────────────────┘
```

Enjoy building with Node.js API Starter!
