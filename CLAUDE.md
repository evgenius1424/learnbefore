# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Learnbefore is a language learning platform that helps users discover unfamiliar words before encountering them in films, books, and blogs. The project is in beta stage with core functionality deployed at [learnbefore.com](https://learnbefore.com).

## Architecture

This is a **Turborepo monorepo** with three main applications and shared packages:

### Applications
- **`apps/learnbefore`** - React/Vite frontend with Clerk authentication and i18n support
- **`apps/learnbefore-next`** - Next.js app with Clerk and Supabase integration
- **`apps/learnbefore-bff`** - Express.js backend-for-frontend with OpenAI integration and MongoDB

### Shared Packages
- **`packages/ui`** - Shared UI components built with shadcn/ui, Radix UI, and Tailwind CSS
- **`packages/types`** - Shared TypeScript type definitions
- **`packages/eslint-config`** - Shared ESLint configuration
- **`packages/typescript-config`** - Shared TypeScript configuration

## Development Commands

### Root Level Commands
```bash
# Start all applications in development mode
pnpm dev

# Build all applications and packages
pnpm build

# Lint all code
pnpm lint

# Format code
pnpm format

# Add shadcn/ui components to the UI package
pnpm ui

# Supabase local development
pnpm supabase:start      # Start local Supabase instance
pnpm supabase:stop       # Stop local Supabase instance
pnpm supabase:restart    # Restart local Supabase instance
pnpm supabase:reset      # Reset database and apply migrations
pnpm supabase:status     # Check status of local services
pnpm supabase:studio     # Open Supabase Studio in browser
pnpm supabase:logs       # View API server logs
pnpm supabase:gen-types  # Generate TypeScript types from database schema
```

### Application-Specific Commands

#### learnbefore (React/Vite)
```bash
cd apps/learnbefore
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

#### learnbefore-next (Next.js)
```bash
cd apps/learnbefore-next
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run Next.js linting
pnpm lint:fix     # Run linting with auto-fix
pnpm typecheck    # Type check without building
```

#### learnbefore-bff (Express.js Backend)
```bash
cd apps/learnbefore-bff
pnpm dev          # Start development server with nodemon
pnpm build        # Compile TypeScript to JavaScript
pnpm preview      # Run compiled JavaScript
pnpm lint         # Run ESLint
```

## Key Technologies

- **Frontend**: React 19, Next.js 15, Vite 6, TypeScript 5.8
- **Authentication**: Clerk
- **Database**: Supabase, MongoDB
- **AI Integration**: OpenAI API
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Internationalization**: i18next
- **Package Manager**: pnpm with workspaces
- **Build System**: Turborepo
- **Runtime**: Node.js 22+ (managed with Volta)

## Environment Variables

Global environment variables (defined in turbo.json):
- `OPENAI_API_KEY` - Required for AI functionality
- `MONGO_CONNECTION_STRING` - MongoDB connection
- `EXPRESS_PORT` - Backend server port

## Development Notes

- The project uses **pnpm workspaces** for dependency management
- **Turbo** handles build orchestration and caching
- The UI package uses **shadcn/ui** components - add new components with `pnpm ui`
- **Supabase** is used for the Next.js app's database needs
- **MongoDB** is used by the Express.js backend
- All apps share TypeScript and ESLint configurations from the packages

## Supabase Local Development

For detailed Supabase local setup instructions, see `SUPABASE_LOCAL_SETUP.md`. Quick start:

1. Start local Supabase: `pnpm supabase:start`
2. Access Studio at http://localhost:54323
3. Use `.env.development` for local environment variables
4. Generate types after schema changes: `pnpm supabase:gen-types`

Local Supabase runs on:
- API: http://127.0.0.1:54321
- Studio: http://127.0.0.1:54323
- Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres