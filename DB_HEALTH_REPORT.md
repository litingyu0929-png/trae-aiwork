
# Database Health Check Report

**Date:** 2026-01-20
**Database**: Supabase (Postgres)

## Schema Verification

| Table Name | Status | Notes |
|------------|--------|-------|
| `profiles` | ✅ Present | Core user data |
| `accounts` | ✅ Present | Social accounts |
| `assets` | ✅ Present | Media assets |
| `contents` | ✅ Present | Generated content |
| `personas` | ✅ Present | AI Personas |
| `system_logs`| ❌ Missing | **Action Required**: Create table or update code |

## Integrity Checks

- **Foreign Keys**:
  - `assets.adopted_by` -> `profiles.id` (Verified)
  - `personas` relations (Verified via schema definition)

- **RLS Policies**:
  - Enabled on all core tables.
  - Policies allow Authenticated users to Read/Write.

## Anomalies Detected
1.  **Missing Table**: `system_logs` is referenced in tests/code but does not exist in the database.
2.  **Schema Cache**: Local client schema cache might be stale regarding `assets` columns. Recommendation: Run `supabase db reset` or refresh client types.

## Migration History
- `20250218000000_init_schema.sql`: Initial core schema.
- `20240119_init_schema.sql`: Personas & Work Tasks.
- `20260120_add_raw_data_column.sql`: Updates.

*Note: Migration timestamps are out of chronological order (2024 vs 2025), which may cause confusion in migration application order.*
