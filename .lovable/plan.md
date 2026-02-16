

# Phase 1: CLI Schema Extensions Migration

## Summary

Run the uploaded SQL migration to add tables, columns, and RPC functions needed for CLI integration. No existing tables, columns, or functions are modified -- this is purely additive.

## What Gets Created

### New Tables

| Table | Purpose |
|-------|---------|
| `api_keys` | Stores bcrypt-hashed API keys for CLI authentication. RLS: users can view, insert, and update (revoke) their own keys. Indexed on `key_prefix` for fast lookup. |
| `credit_txns` | Audit trail for all credit movements (deductions, refunds, grants, purchases). RLS: users can view their own transactions only. Insert-only from backend (service role). |

### New Columns on `audits`

| Column | Type | Purpose |
|--------|------|---------|
| `source` | TEXT (web/cli) | Identifies audit origin |
| `session_token` | TEXT (unique) | CLI session identifier |
| `complexity` | INTEGER (1-3) | Audit complexity tier |
| `credits_deducted` | NUMERIC(12,2) | Credits charged for this audit |
| `tier_discount` | NUMERIC(4,2) | Discount applied |
| `scope_metadata` | JSONB | Structured scope info |
| `context_metadata` | JSONB | Structured context info |
| `contracts_completed` | INTEGER | Progress tracking |
| `contracts_total` | INTEGER | Progress tracking |
| `current_contract` | TEXT | Currently processing contract |
| `error_message` | TEXT | Failure reason |

### New RPC Functions

| Function | Purpose |
|----------|---------|
| `cli_deduct_credits(p_user_id, p_amount, p_audit_id, p_description)` | Atomically deducts credits and logs a `credit_txns` entry. Used by CLI session start. |
| `cli_refund_credits(p_user_id, p_amount, p_audit_id, p_description)` | Refunds credits and logs a `credit_txns` entry. Used on CLI audit failure/cancellation. |

Both functions are `SECURITY DEFINER` so they can be called from edge functions with the service role key.

## Execution

Apply the full SQL from the uploaded `spec-migration.sql` file as a single database migration. All statements are idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`).

## What Does NOT Change

- Existing `deduct_credits` and `refund_credits` RPCs (web flow continues using them)
- Existing `audits` columns and RLS policies
- No frontend code changes in this phase

