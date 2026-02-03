# Team Tasks Backend API

A production-grade task management backend built with NestJS, TypeScript, and PostgreSQL following clean architecture principles.

## 🏗️ Architecture

This project follows the **Node.js Backend Architecture Guidelines** with:

- **Feature-based modular structure** - Each feature (auth, users, tasks) is self-contained
- **Dependency Injection** - NestJS native DI for testability and maintainability
- **Stateless design** - JWT-based authentication, no server-side sessions
- **Database per service** - Dedicated PostgreSQL database
- **N+1 query prevention** - Eager loading with TypeORM relationships
- **Consistent error handling** - Global exception filters
- **Input validation** - Class-validator DTOs with pipes

## 📋 Features

- ✅ JWT Authentication (stateless)
- ✅ Role-based access control (Admin/Member)
- ✅ Task CRUD operations
- ✅ Task filtering (by status, assignee, search)
- ✅ Authorization guards
- ✅ Input validation
- ✅ Error handling
- ✅ Database seeding

## 🛠️ Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (passport-jwt)
- **Validation**: class-validator

## 📂 Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── auth.controller.ts   # Login endpoint
│   ├── auth.service.ts      # JWT token generation
│   ├── auth.module.ts
│   ├── jwt.strategy.ts      # Passport JWT strategy
│   └── dto/
│       └── login.dto.ts
├── users/                   # Users module
│   ├── users.controller.ts  # User endpoints
│   ├── users.service.ts     # User business logic
│   ├── users.module.ts
│   └── user.entity.ts       # User database model
├── tasks/                   # Tasks module
│   ├── tasks.controller.ts  # Task endpoints
│   ├── tasks.service.ts     # Task business logic
│   ├── tasks.module.ts
│   ├── task.entity.ts       # Task database model
│   └── dto/
│       └── task.dto.ts
├── common/                  # Shared utilities
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── get-user.decorator.ts
│   └── filters/
│       └── http-exception.filter.ts
├── config/
│   └── database.config.ts
├── app.module.ts
└── main.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL 12 or higher
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd team-tasks-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=team_tasks_db
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

4. **Create the database**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE team_tasks_db;

# Exit
\q
```

5. **Run the application**
```bash
# Development mode (with auto-reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`

### Seed Database (Optional)

Populate the database with sample data:

```bash
npm run seed
```

This creates:
- 3 users (1 admin, 2 members)
- 6 sample tasks

Sample credentials:
- Admin: `admin@teamtasks.com` (role: admin)
- Member: `john@teamtasks.com` (role: member)
- Member: `jane@teamtasks.com` (role: member)

## 📡 API Endpoints

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@teamtasks.com",
  "role": "admin"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@teamtasks.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**Note:** For subsequent requests, include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Users

#### Get All Users
```http
GET /users
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "admin@teamtasks.com",
    "name": "Admin User",
    "role": "admin"
  }
]
```

### Tasks

#### Get All Tasks (with filters)
```http
GET /tasks?status=todo&assigneeId=uuid&search=setup
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (todo | in_progress | done)
- `assigneeId` (optional): Filter by assigned user ID
- `search` (optional): Search in task titles

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Setup development environment",
    "description": "Install Node.js, PostgreSQL...",
    "status": "done",
    "dueDate": "2024-02-01",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T15:30:00.000Z",
    "assigneeId": "uuid",
    "assignee": {
      "id": "uuid",
      "email": "john@teamtasks.com",
      "name": "John Doe",
      "role": "member"
    }
  }
]
```

#### Get Task by ID
```http
GET /tasks/:id
Authorization: Bearer <token>
```

#### Create Task (Admin Only)
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New task",
  "description": "Task description",
  "status": "todo",
  "assigneeId": "uuid",
  "dueDate": "2024-03-01"
}
```

#### Update Task
```http
PUT /tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "status": "in_progress"
}
```

**Authorization:**
- **Admins**: Can update any field
- **Members**: Can only update `status` field

#### Delete Task (Admin Only)
```http
DELETE /tasks/:id
Authorization: Bearer <token>
```

## 🔐 Authorization Rules

### Admin
- Can create tasks
- Can update all task fields
- Can delete tasks
- Can view all tasks and users

### Member
- Can view all tasks and users
- Can only update task status (cannot change title, description, assignee, or due date)
- Cannot create or delete tasks

## 🏛️ Architecture Decisions

### Why NestJS?
- Built-in dependency injection
- Modular architecture
- TypeScript-first
- Enterprise-grade patterns
- Aligns with company Node.js guidelines

### Why JWT (Stateless)?
- Horizontal scalability
- No server-side session storage
- Works across distributed systems
- Simpler infrastructure

### Why PostgreSQL?
- Relational data with clear relationships
- Strong consistency guarantees
- ACID transactions
- Better TypeScript integration with TypeORM

### Preventing N+1 Queries
The Task entity uses `{ eager: true }` on the assignee relationship:

```typescript
@ManyToOne(() => User, (user) => user.tasks, { eager: true })
assignee: User;
```

This automatically loads assignees in a single JOIN query instead of N separate queries.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚢 Deployment

### Build for production
```bash
npm run build
```

### Run production build
```bash
npm run start:prod
```

### Environment Variables for Production

Ensure these are set in your production environment:
- `NODE_ENV=production`
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (use a strong secret!)
- `PORT`

**Important:** Set `synchronize: false` in production and use migrations instead.

## 📝 Additional Notes

### Simplified Authentication
For this intern project, authentication is simplified:
- No real passwords (just email + role)
- Users are auto-created on first login
- In production, you'd add: password hashing (bcrypt), registration endpoint, email verification, password reset

### Database Migrations
In production, replace `synchronize: true` with proper migrations:
```bash
npm install -g typeorm
typeorm migration:generate -n CreateTables
typeorm migration:run
```

## 🤝 Contributing

1. Follow the Node.js Architecture Guidelines
2. Maintain feature-based structure
3. Write tests for new features
4. Use TypeScript strictly
5. Follow existing code patterns

## 📚 References

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Company Node.js Guidelines](internal link)
- [Data & Database Architecture Guidelines](internal link)

## 📄 License

MIT