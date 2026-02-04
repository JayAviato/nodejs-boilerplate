# Enterprise Node.js + TypeScript Boilerplate

> *"The universe tends toward disorder. This boilerplate is the act of building walls against entropy."*

A production-ready, enterprise-grade Node.js + TypeScript starter kit implementing Clean/Hexagonal Architecture principles with strict type safety, robust error handling, and modern testing practices.

## ✨ Features

- **🏗️ Clean Architecture** - Strict layer separation (Domain → Application → Infrastructure → Presentation)
- **📦 Strict TypeScript** - Zero tolerance for `any`, strict null checks, and maximum type safety
- **✅ Zod Validation** - Runtime validation with inferred types (no duplication)
- **📄 Cursor Pagination** - Bi-directional, type-safe cursor pagination utility
- **🎯 Result Monad** - Functional error handling without exceptions
- **🔌 Dependency Injection** - Simple, type-safe DI container
- **📝 Structured Logging** - Pino-based logging with pretty dev output
- **🧪 Vitest Testing** - Unit and integration test setup with factories
- **🗄️ Prisma ORM** - Type-safe database access with repository pattern
- **🔌 WebSockets** - Real-time communication with Socket.io

## 🚀 Quick Start

> **New to the team?** Start by checking [DEVELOPERS.md](./DEVELOPERS.md) for a day-to-day guide on adding features, debugging, and testing.

### Using the CLI (Recommended)

```bash
# Initialize a new project
npx nodets-boilerplate-aviato my-new-app
```

### Manual Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Start development server
npm run dev
```

## 📁 Project Structure

```
src/
├── domain/                    # Enterprise Business Rules (innermost)
│   ├── entities/              # Core business objects
│   ├── value-objects/         # Immutable domain primitives
│   ├── repositories/          # Repository interfaces (ports)
│   ├── errors/                # Domain-specific errors
│   └── events/                # Domain event definitions
│
├── application/               # Application Business Rules
│   ├── use-cases/             # Application services
│   ├── dtos/                  # Data Transfer Objects (validated)
│   ├── ports/                 # Secondary ports (external services)
│   └── errors/                # Application errors
│
├── infrastructure/            # Frameworks & Drivers
│   ├── database/              # Database implementations
│   ├── config/                # Configuration loading
│   ├── logging/               # Logging implementation
│   └── container/             # Dependency injection
│
├── presentation/              # Interface Adapters
│   ├── http/                  # HTTP layer (Express)
│   └── mappers/               # Entity <-> DTO mappers
│
├── shared/                    # Cross-cutting concerns
│   ├── utils/                 # Utilities (pagination, result)
│   └── types/                 # Shared type definitions
│
└── main.ts                    # Application entry point
```

## 🎯 Key Concepts

### Cursor Pagination

```typescript
import { CursorPaginator, createIdPaginator } from '@shared/utils/cursor-pagination.util';

// Create a paginator
const paginator = createIdPaginator<User>();

// Build paginated result (entities should have limit + 1 items)
const result = paginator.buildResult(users, { limit: 20, cursor });

// Response includes:
// - data: User[]
// - pagination: { nextCursor, prevCursor, hasNextPage, hasPrevPage, count }
```

### Result Monad

```typescript
import { ok, err, isOk, map, andThen, type Result } from '@shared/utils/result';

// Return explicit success/failure
function divide(a: number, b: number): Result<number, string> {
  return b === 0 ? err('division by zero') : ok(a / b);
}

// Chain operations
const result = andThen(
  divide(10, 2),
  (x) => divide(x, 2)
);

// Handle result
if (isOk(result)) {
  console.log(result.value); // 2.5
}
```

### Zod Validation

```typescript
import { z } from 'zod';

// Define schema once, infer type automatically
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

// Type is inferred - no duplication!
type CreateUserDto = z.infer<typeof createUserSchema>;

// Use with validation middleware
router.post('/users', validate({ body: createUserSchema }), controller);
```

### Error Handling

```typescript
// Domain errors (business rule violations)
throw new EntityNotFoundError('User', userId);

// Application errors (HTTP-aware)
throw new UnauthorizedError('Invalid token');

// All errors are caught by global error handler:
// - Logged with full details for developers
// - Sanitized for client response
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Test Factories

```typescript
import { userFactory, traits } from 'tests/factories/entity.factory';

// Create a user with defaults
const user = userFactory.build();

// Override specific fields
const admin = userFactory.build({ name: 'Admin User' });

// Create multiple
const users = userFactory.buildMany(10);

// Apply traits
const deletedUser = traits.deleted(userFactory.build());
```

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run typecheck` | Check TypeScript types |
| `npm run test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema to database |

## 🔧 Configuration

Environment variables are validated at startup using Zod. See `.env.example` for all available options:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
DB_TYPE="postgres" # postgres | mysql | mongo | firestore

# Firebase (Only if DB_TYPE=firestore)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Security
JWT_SECRET=your-secret-key-min-32-chars

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

## 🏛️ Architecture Philosophy

> **Want a deep dive?** Read the [Architecture Guide](./ARCHITECTURE.md) for a detailed breakdown perfect for onboarding new team members.

### Clean Architecture

Dependencies flow **inward**. The domain layer knows nothing about HTTP, databases, or frameworks. This makes the core business logic:

- **Testable** - No mocking of external systems needed
- **Maintainable** - Changes to infrastructure don't affect domain
- **Portable** - Swap Express for Fastify without touching business logic

### Type Safety

TypeScript's compile-time guarantees are enhanced with:

- **Strict mode** - No implicit any, strict null checks
- **Zod runtime validation** - Types and validation in one place
- **Branded types** - Nominal typing for IDs to prevent mixing

### Error Handling

- **Domain errors** - Business rule violations (e.g., `EntityNotFoundError`)
- **Application errors** - Use case failures (e.g., `UnauthorizedError`)
- **Result monad** - Explicit success/failure without exceptions

## 📄 License

MIT
