# @williamvux/service-core

Shared building blocks for the Express + TypeScript backends.

## What is inside

| Area                               | Exports                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Decorators                         | `@Controller`, `@Inject`, `@Get/@Post/@Put/@Patch/@Delete`, `@Status`, `@Guard`, `registerControllers`, `instantiate` |
| Responses                          | `ApiResult`, `JsonResponse`, `sendResponse`                                                                           |
| Errors                             | `AppError` (`invalid`, `unauthorized`, `forbidden`, `notFound`, `conflict`), `errorHandler`                           |
| Middleware                         | `createErrorHandler` / `errorHandler`                                                                                 |
| Infrastructure                     | `DI`, `BaseRepository`                                                                                                |
| `@williamvux/service-core/testing` | `makeFakeRouter`, `callRoute`                                                                                         |

## Install

The package is published to GitHub Packages, so every project that uses it needs an `.npmrc` that maps the scope to that registry and a token with the `read:packages` permission:

```ini
@williamvux:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Do not commit a real token: keep it in an environment variable (`GITHUB_TOKEN`) and commit only the `.npmrc` above.

```bash
yarn add @williamvux/service-core express knex
```

`express` and `knex` are peer dependencies: keep one copy of each, and one copy of this package, because the `@Controller` registry lives in the module.

## Use

```ts
import express from 'express';
import {
    Controller,
    Get,
    Inject,
    errorHandler,
    registerControllers,
} from '@williamvux/service-core';

@Controller()
@Inject('greeting')
class HelloController {
    constructor(private greeting: string) {}

    @Get('/hello')
    async hello() {
        return this.greeting;
    }
}

const router = express.Router();
registerControllers(router);
app.use('/api', router);
app.use(errorHandler);
```

Methods return data (sent as `{ success: true, data }` with the `@Status` code, default 200) or an `ApiResult`. Throw `AppError` for business errors.

## Logging

The package never logs by itself. `createErrorHandler` takes a hook, so you decide where the output goes (pino, console, a coloured logger...):

```ts
import { createErrorHandler } from '@williamvux/service-core';

app.use(
    createErrorHandler({ onUnexpectedError: (error, req) => log.error(error) }),
);
```

`onUnexpectedError` is called for the errors that become a 500 (not for `AppError` or client 4xx).

## Requirements for the app

- Decorators are standard TC39 decorators: run through tsx or esbuild, and do not enable `experimentalDecorators`. `target` must be `esnext`.
- Node `>= 22.18`.

## Development

```bash
nvm use
yarn install
yarn verify        # typecheck, lint, format check, test, build, pack check
```

| Script                                               | What it does                                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `yarn build`                                         | `dist/*.js` (esbuild) and `dist/types/*.d.ts` (tsc)                                                        |
| `yarn test`                                          | Unit tests (`node:test` through tsx)                                                                       |
| `yarn typecheck` / `yarn lint` / `yarn format:check` | Static checks                                                                                              |
| `yarn pack:check`                                    | Packs the package, installs the tarball in a temp project and runs a sample app against it (needs network) |

`typescript` is aliased to TypeScript 6 only because typescript-eslint does not support 7 yet; `tsc` itself is TypeScript 7 (`typescript7`). Remove the alias once typescript-eslint supports 7.

## Release

1. Bump `version` in `package.json` and commit.
2. Tag it and push the tag: `git tag v0.1.0 && git push origin v0.1.0`.
3. The `Publish` workflow checks that the tag matches `version`, runs `yarn verify` and runs `npm publish` to GitHub Packages with the workflow's own `GITHUB_TOKEN`.

A version can only be published once, so bump it for every release.
