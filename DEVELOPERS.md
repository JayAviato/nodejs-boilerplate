# 👨‍💻 Developer's Guide

Welcome to the team! This guide will help you understand how to work with this boilerplate day-to-day. It focuses on **workflows** and **implementation details**.

## 🧠 Mental Model

This project uses **Clean Architecture**. The most important rule is the **Dependency Rule**:
> Source code dependencies can only point **inwards**. Nothing in an inner circle can know anything at all about something in an outer circle.

- **Presentation** (Controllers) depends on **Application** (Use Cases)
- **Infrastructure** (Database/Prisma) depends on **Domain** (Repositories/Entities)
- **Application** depends on **Domain**
- **Domain** depends on **NOTHING**

## 🛠️ Common Workflows

### 1. Adding a New Feature (End-to-End)

Let's say you want to add a feature to **"Publish a Post"**.

#### Step 1: Domain (The Core)
Define what a "Post" is and what "Publishing" means.
- Edit `src/domain/entities/post.entity.ts`: Add `publish()` method.
- Edit `src/domain/repositories/post.repository.ts`: Ensure `update()` is defined.

#### Step 2: Application (The Use Case)
Create the business logic that orchestrates the domain.
- Create `src/application/use-cases/publish-post.use-case.ts`.
- It should accept `PublishPostDto` (validate input).
- It should load the entity, call `post.publish()`, and save it back.

```typescript
// src/application/use-cases/publish-post.use-case.ts
export class PublishPostUseCase extends BaseUseCase<PublishPostDto, PostDto> {
  constructor(private postRepo: IPostRepository) { super(); }

  protected async executeInternal(dto: PublishPostDto): Promise<Result<PostDto, ApplicationError>> {
    // 1. Load
    const postResult = await this.postRepo.findById(dto.postId);
    if (isErr(postResult)) return err(postResult.error);
    const post = postResult.value;

    // 2. Act (Domain Logic)
    post.publish();

    // 3. Save
    await this.postRepo.update(post);

    // 4. Return
    return ok(PostMapper.toDto(post));
  }
}
```

#### Step 3: Presentation (The Controller)
Expose this via HTTP.
- Create/Update `src/presentation/http/controllers/post.controller.ts`.
- Use the `validate()` middleware with a Zod schema.

```typescript
// src/presentation/http/controllers/post.controller.ts
router.post(
  '/:id/publish',
  validate({ params: postIdSchema }),
  (req, res) => controller.publish(req, res)
);
```

### 2. Database Migrations

We use **Prisma** for database management.

- **Modify Schema**: Edit `src/infrastructure/database/prisma/schema.prisma`.
- **Create Migration**: Run `npm run db:migrate --name add_published_at_to_posts`.
- **Generate Client**: Run `npm run db:generate` (automatically runs after migrate).

> **Note**: Never modify `migrations/` SQL files manually unless you know exactly what you are doing.

### 3. Error Handling

**DO NOT** throw errors for business logic. Use the `Result` pattern.

- **Good**: `return err(new InsufficientFundsError(amount));`
- **Bad**: `throw new Error("Not enough money");`

Exceptions should be reserved for **unexpected** system failures (DB connection execution failed, OOM, etc.).

### 4. Logging

Use the global logger port. Context is automatically attached by middleware.

```typescript
// In a Use Case or Service
this.logger.info('Publishing post', { postId: dto.postId });
```

In development, logs are pretty-printed. In production, they are JSON.

## 🐛 Debugging Tips

1. **VS Code**: Use the "Debug" tab. The `launch.json` is configured to run `npm run dev` with debugger attached.
2. **Verbose Logging**: Set `LOG_LEVEL=trace` in `.env` to see SQL queries and full context.
3. **Test Mode**: Run `npm test` to verify logic without spinning up the full server.

## 🧪 Testing Strategy

- **Unit Tests (`*.test.ts`)**: Test pure logic (Entities, Value Objects, Utilities). Fast. No DB.
- **Integration Tests**: Test Repositories and Use Cases with a real DB (use test containers or local DB).
- **Factories**: Use `tests/factories/entity.factory.ts` to generate test data easily.

```typescript
const post = postFactory.build({ title: 'Special Post' });
```

## 🧹 Code Hygiene

- **Linting**: Run `npm run lint` before committing.
- **Type Check**: Run `npm run typecheck` to catch strict null errors.
- **Imports**: Use aliases (`@domain`, `@application`) instead of `../../`.

## 🆘 Troubleshooting

**Q: "Cannot find module..."**
A: Check `tsconfig.json` paths and make sure you are importing from the alias or relative path correctly.

**Q: "Prisma Client not initialized"**
A: Ensure you called `connectDatabase()` in `main.ts` before using repositories.

**Q: "Env var undefined"**
A: Did you add it to `.env` AND `src/infrastructure/config/env.config.ts`? The app fails fast if env vars are missing.
