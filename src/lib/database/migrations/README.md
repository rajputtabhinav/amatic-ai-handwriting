# Database Migrations

This directory contains SQL migration files for the Amatic.ai database.

## Migration Files

Migrations are numbered sequentially and should be run in order:

1. `001_initial_schema.sql` - Creates all tables and indexes
2. `002_functions_and_triggers.sql` - Creates database functions and triggers
3. `003_row_level_security.sql` - Enables Row Level Security policies

## Running Migrations

### For Supabase

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file in order
4. Execute each migration

### For Local Development

```bash
# Using psql
psql -U postgres -d amatic_db -f src/lib/database/migrations/001_initial_schema.sql
psql -U postgres -d amatic_db -f src/lib/database/migrations/002_functions_and_triggers.sql
psql -U postgres -d amatic_db -f src/lib/database/migrations/003_row_level_security.sql
```

## Creating New Migrations

1. Create a new file with the next sequential number: `00X_description.sql`
2. Add a header comment with:
   - Migration number and name
   - Description of changes
   - Date
3. Write idempotent SQL (use `IF NOT EXISTS`, `OR REPLACE`, etc.)
4. Test the migration on a development database
5. Document any manual steps required

## Migration Best Practices

- Always use transactions when possible
- Make migrations idempotent (can be run multiple times safely)
- Never modify existing migration files after they've been deployed
- Create a new migration to fix issues from previous migrations
- Test migrations on a copy of production data before deploying
- Keep migrations small and focused on a single change
- Document any data transformations or manual steps required

## Rollback Strategy

To rollback a migration:

1. Create a new migration file with the rollback SQL
2. Number it sequentially after the migration to rollback
3. Document which migration it rolls back

Example:
```sql
-- Migration: 004_rollback_003
-- Description: Rollback RLS policies from migration 003
-- Date: 2025-01-06

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ... etc
```

## Migration Status Tracking

Consider using a migrations table to track which migrations have been applied:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Automated Migration Tools

For production, consider using migration tools like:

- [node-pg-migrate](https://github.com/salsita/node-pg-migrate)
- [db-migrate](https://github.com/db-migrate/node-db-migrate)
- [Flyway](https://flywaydb.org/)
- [Liquibase](https://www.liquibase.org/)

## Emergency Procedures

If a migration fails in production:

1. **DO NOT PANIC**
2. Check the error message and logs
3. If the migration is partially applied, determine what succeeded
4. Create a rollback migration if needed
5. Test the rollback on a copy of production data
6. Apply the rollback to production
7. Fix the original migration
8. Test thoroughly before reapplying

## Contact

For migration issues, contact the development team or check the main README.

