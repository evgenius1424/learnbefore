# Supabase Local Development Setup

This guide will help you set up Supabase locally for development.

## Prerequisites

- Docker Desktop installed and running
- Supabase CLI installed (already included in devDependencies)
- Node.js 20+ and pnpm

## Quick Start

1. **Start Supabase locally:**
   ```bash
   pnpm supabase:start
   ```
   This will start all Supabase services locally including:
   - PostgreSQL database on port 54322
   - API server on port 54321
   - Studio (admin panel) on port 54323
   - Inbucket (email testing) on port 54324

2. **Access Supabase Studio:**
   Open http://localhost:54323 in your browser to access the local Supabase admin panel.

3. **Switch to local environment:**
   The app will automatically use local Supabase when you have the local instance running, or you can manually switch by updating your environment variables to use `.env.development` values.

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm supabase:start` | Start local Supabase instance |
| `pnpm supabase:stop` | Stop local Supabase instance |
| `pnpm supabase:restart` | Restart local Supabase instance |
| `pnpm supabase:reset` | Reset database and apply migrations |
| `pnpm supabase:status` | Check status of local services |
| `pnpm supabase:studio` | Open Supabase Studio in browser |
| `pnpm supabase:logs` | View API server logs |
| `pnpm supabase:gen-types` | Generate TypeScript types from database schema |

## Local URLs

When Supabase is running locally:

- **API URL:** http://127.0.0.1:54321
- **Studio:** http://127.0.0.1:54323
- **Database:** postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Email Testing:** http://127.0.0.1:54324

## Environment Configuration

### For Local Development
Use `.env.development` which is configured for local Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### For Production
Use `.env.local` which points to your hosted Supabase project:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

## Database Schema

The local database will be initialized with:
- All migrations from `supabase/migrations/`
- Seed data from `supabase/seed.sql`
- Row Level Security policies
- Clerk integration for authentication

## Workflow

1. **Start development:**
   ```bash
   pnpm supabase:start    # Start local Supabase
   pnpm dev               # Start Next.js app
   ```

2. **Make database changes:**
   ```bash
   # Make changes in Supabase Studio or SQL files
   pnpm supabase:gen-types  # Generate new TypeScript types
   ```

3. **Reset if needed:**
   ```bash
   pnpm supabase:reset    # Resets DB and applies all migrations
   ```

4. **Stop when done:**
   ```bash
   pnpm supabase:stop     # Stop local Supabase
   ```

## Clerk Integration

The local setup is configured to work with Clerk authentication. The `config.toml` includes:

```toml
[auth.third_party.clerk]
enabled = true
domain = "busy-labrador-38.clerk.accounts.dev"
```

This allows seamless authentication flow between Clerk and your local Supabase instance.

## Troubleshooting

### Common Issues

1. **Port conflicts:** If ports 54321-54324 are in use, stop other services or modify `supabase/config.toml`

2. **Docker not running:** Ensure Docker Desktop is running before starting Supabase

3. **Database connection issues:** Check that PostgreSQL port 54322 is available

4. **Migration errors:** Run `pnpm supabase:reset` to reset the database

### Logs and Debugging

- Check service status: `pnpm supabase:status`
- View API logs: `pnpm supabase:logs`
- Access PostgreSQL directly: `psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'`

## Production Deployment

When deploying to production, ensure your hosted Supabase project has:
- All migrations applied
- Proper RLS policies
- Clerk integration configured
- Environment variables pointing to production URLs