# 🏛️ Architecture Guide

This project implements **Clean Architecture** (also known as Hexagonal Architecture or Ports and Adapters). It is designed to keep your *business logic* independent of your *technical choices* (like databases, frameworks, or external APIs).

## 1. The Core Philosophy: "Dependencies Point Inward"

Imagine the application as a set of concentric circles.

*   **The Center (Domain)**: This is the pure business logic. It knows *nothing* about the outside world.
*   **The Middle (Application)**: This orchestrates the domain to perform tasks.
*   **The Outside (Infrastructure/Presentation)**: These are the tools we use (Express, Postgres, Socket.io).

>**The Golden Rule**: Outer layers can depend on inner layers, but inner layers **never** depend on outer layers.

---

## 2. The Layers (From Inside Out)

### 🟢 Domain Layer (`src/domain/`)
*   **What it is**: The heart of the software. Pure TypeScript classes.
*   **What lives here**:
    *   **Entities**: Objects with business rules (e.g., `User`, `Post`).
    *   **Repositories (Interfaces)**: Contracts defining *what* needs to be saved, but not *how* (e.g., `IUserRepository`).
    *   **Errors**: Business problems (e.g., `InsufficientFundsError`).
*   **Key Lesson**: "If we switch from SQL to Firestore, this layer **must not change**."

### 🟡 Application Layer (`src/application/`)
*   **What it is**: The "Manager". It coordinates the work.
*   **What lives here**:
    *   **Use Cases**: Specific actions a user can take (e.g., `PublishPostUseCase`).
    *   **DTOs**: Strict Data Transfer Objects that validate input (using Zod).
    *   **Ports**: Interfaces for external services (e.g., `IEmailService`, `ISocketService`).
*   **Key Lesson**: "This layer tells the Domain *what* to do, but relies on Infrastructure to actually *save* or *send* data."

### 🔴 Infrastructure Layer (`src/infrastructure/`)
*   **What it is**: The "Plumbing". It implements the interfaces defined in inner layers.
*   **What lives here**:
    *   **Database Adapters**: `PrismaUserRepository`, `FirestoreBaseRepository`.
    *   **External Services**: `SocketIOService` (implements `ISocketService`).
    *   **Configuration**: Environment variables (`env.config.ts`).
*   **Key Lesson**: "This is the only place that knows we use Postgres or Socket.io. We can swap these files out without breaking the app."

### 🔵 Presentation Layer (`src/presentation/`)
*   **What it is**: The "Entry Point". It handles how the world talks to us.
*   **What lives here**:
    *   **HTTP**: Express controllers, routers, middleware.
    *   **Mappers**: Converts internal Entities into JSON responses.
*   **Key Lesson**: "Controllers are dumb. They just validate the request, call a Use Case, and send back the result."

---

## 3. Key Patterns We Use

*   **Dependency Injection (DI)**: Instead of importing "Prisma" directly into a Use Case, we ask for an `IRepository`. The `Container` injects the correct version at runtime. This is why we can switch between SQL and Firestore just by changing a config!
*   **Result Monad**: We don't throw exceptions for business logic (like "User not found"). We return a `Result.err()`. This makes error handling type-safe and explicit.
*   **Cursor Pagination**: We use stable pointers (cursors) instead of `offset/limit` for infinite scrolling that scales to millions of records.

---

## 4. Real-World Analogy for Juniors

> "Think of the **Domain** as the **CEO**. It sets the rules and strategy.
>
> The **Application** layer is the **Managers**. They take orders from the CEO and coordinate resources to get things done.
>
> The **Infrastructure** is the **Vendors** (AWS, Google, SQL). The CEO doesn't care which vendor prints the business cards, as long as they get printed correctly.
>
> If we fire the printing vendor (switch DBs), the CEO (Domain) doesn't need to change their strategy."
