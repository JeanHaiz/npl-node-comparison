# Node.js API Starter

Enterprise-grade Node.js API starter template with built-in JWT authentication, PostgreSQL persistence, Swagger documentation, audit logging, and automatic transaction rollbacks.

## Features

- **JWT Authentication** - Integrated with Keycloak for secure authentication and authorization
- **PostgreSQL Persistence** - Automatic persistence with TypeORM
- **REST API** - Full CRUD operations with pagination and filtering
- **Swagger Documentation** - Auto-generated API documentation at `/api-docs`
- **Audit Logging** - Comprehensive audit trail for all database operations
- **Transaction Management** - Automatic rollback on errors
- **Soft Delete** - Built-in soft delete functionality with restore capability
- **Request Context** - Automatic user context tracking throughout request lifecycle
- **Error Handling** - Centralized error handling with detailed logging
- **TypeScript** - Full type safety and modern JavaScript features

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd npl-node-comparison
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Start infrastructure services (PostgreSQL and Keycloak):
```bash
docker-compose up -d
```

5. Wait for services to be ready (about 30-60 seconds):
```bash
docker-compose ps
```

6. Configure Keycloak (see Keycloak Setup section below)

7. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Keycloak Setup

After starting Docker Compose, configure Keycloak:

1. Access Keycloak admin console: `http://localhost:11000`
   - Username: `admin`
   - Password: `admin`

2. Create a client for the API:
   - Go to Clients → Create
   - Client ID: `node-api-client`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `*`
   - Save

3. Get the client secret:
   - Go to Clients → `node-api-client` → Credentials tab
   - Copy the Secret
   - Update `.env` file with `KEYCLOAK_CLIENT_SECRET`

4. Create a test user:
   - Go to Users → Add user
   - Username: `testuser`
   - Email: `test@example.com`
   - Save
   - Go to Credentials tab
   - Set password (disable Temporary)

5. Get a JWT token for testing:
```bash
curl -X POST 'http://localhost:11000/realms/master/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=node-api-client' \
  -d 'client_secret=YOUR_CLIENT_SECRET' \
  -d 'username=testuser' \
  -d 'password=YOUR_PASSWORD' \
  -d 'grant_type=password'
```

## API Documentation

Once the server is running, access the interactive Swagger documentation at:

```
http://localhost:3000/api-docs
```

### Available Endpoints

#### Tasks API

- `GET /api/tasks` - Get all tasks (paginated)
- `GET /api/tasks/:id` - Get task by ID
- `GET /api/tasks/status/:status` - Get tasks by status
- `GET /api/tasks/filter/overdue` - Get overdue tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Soft delete task
- `POST /api/tasks/:id/restore` - Restore deleted task

#### Health Check

- `GET /health` - Health check endpoint (no auth required)

### Authentication

All API endpoints (except `/health` and `/api-docs`) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Project Structure

```
src/
├── config/
│   ├── database.ts       # TypeORM configuration
│   ├── logger.ts         # Winston logger setup
│   └── swagger.ts        # Swagger/OpenAPI configuration
├── entities/
│   ├── BaseEntity.ts     # Base entity with audit fields
│   ├── AuditLog.ts       # Audit log entity
│   └── Task.ts           # Example Task entity
├── services/
│   ├── BaseService.ts    # Generic CRUD service with transactions
│   └── TaskService.ts    # Task-specific service
├── controllers/
│   └── TaskController.ts # Task REST API controller
├── middleware/
│   ├── auth.middleware.ts    # JWT authentication
│   ├── context.middleware.ts # Request context
│   └── error.middleware.ts   # Error handling
├── subscribers/
│   └── AuditSubscriber.ts    # TypeORM subscriber for audit logging
└── index.ts              # Application entry point
```

## Creating New Entities

To create a new entity with full CRUD capabilities:

1. **Create the Entity** (extend BaseEntity):

```typescript
// src/entities/Product.ts
import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity';

@Entity('products')
export class Product extends BaseEntity {
  @Column()
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;
}
```

2. **Create the Service** (extend BaseService):

```typescript
// src/services/ProductService.ts
import { BaseService } from './BaseService';
import { Product } from '../entities/Product';

export class ProductService extends BaseService<Product> {
  constructor() {
    super(Product);
  }

  // Add custom methods here
}
```

3. **Create the Controller**:

```typescript
// src/controllers/ProductController.ts
import { Router, Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const productService = new ProductService();

router.get('/', authenticate, async (req: Request, res: Response) => {
  const result = await productService.findAll();
  res.json(result);
});

// Add more routes...

export default router;
```

4. **Register the Controller** in `src/index.ts`:

```typescript
import productController from './controllers/ProductController';
app.use('/api/products', productController);
```

## Key Features Explained

### Automatic Audit Logging

All database operations are automatically logged with:
- Entity name and ID
- Operation type (CREATE, UPDATE, DELETE)
- User who performed the action
- Old and new values
- Timestamp
- IP address and user agent

View audit logs in the `audit_logs` table.

### Transaction Management

All service operations run within transactions that automatically rollback on errors:

```typescript
// Automatic transaction with rollback
const task = await taskService.create({
  title: 'My Task',
  description: 'Task description'
});
// If any error occurs, changes are automatically rolled back
```

### Soft Delete

Entities are soft-deleted by default (marked as deleted but not removed):

```typescript
// Soft delete
await taskService.delete(taskId);

// Restore
await taskService.restore(taskId);

// Hard delete (permanent)
await taskService.hardDelete(taskId);
```

### Request Context

User information is automatically available throughout the request:

```typescript
import { getContext } from './middleware/context.middleware';

const context = getContext();
console.log(context.userId);    // Current user ID
console.log(context.userEmail); // Current user email
```

### Pagination

All list endpoints support pagination:

```
GET /api/tasks?page=1&limit=10&sortBy=createdAt&sortOrder=DESC
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run typeorm` - Run TypeORM CLI commands
- `npm run migration:generate` - Generate database migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `PORT` - Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` - PostgreSQL connection
- `KEYCLOAK_URL` - Keycloak server URL
- `KEYCLOAK_REALM` - Keycloak realm name
- `KEYCLOAK_CLIENT_ID` - Keycloak client ID
- `KEYCLOAK_CLIENT_SECRET` - Keycloak client secret

## Testing the API

### Using cURL

Get a token:
```bash
TOKEN=$(curl -s -X POST 'http://localhost:11000/realms/master/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=node-api-client' \
  -d 'client_secret=YOUR_SECRET' \
  -d 'username=testuser' \
  -d 'password=YOUR_PASSWORD' \
  -d 'grant_type=password' | jq -r '.access_token')
```

Create a task:
```bash
curl -X POST 'http://localhost:3000/api/tasks' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "My First Task",
    "description": "Task description",
    "status": "TODO",
    "priority": "HIGH"
  }'
```

Get all tasks:
```bash
curl -X GET 'http://localhost:3000/api/tasks' \
  -H "Authorization: Bearer $TOKEN"
```

### Using Swagger UI

1. Go to `http://localhost:3000/api-docs`
2. Click "Authorize" button
3. Enter your JWT token (with "Bearer " prefix)
4. Try out the endpoints interactively

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set environment variables for production
3. Run migrations:
```bash
npm run migration:run
```

4. Start the server:
```bash
npm start
```

For production, consider:
- Using a process manager (PM2, systemd)
- Setting up proper logging and monitoring
- Using environment-specific configuration
- Implementing rate limiting
- Setting up SSL/TLS
- Using a reverse proxy (nginx, traefik)

## License

MIT
