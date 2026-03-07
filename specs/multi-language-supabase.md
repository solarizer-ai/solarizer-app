# Multi-Language Support: Supabase Schema + Edge Function Changes

## Overview

The Solarizer platform now supports multiple audit languages (Solidity, Rust/Solana).
This spec describes the database migration and edge function updates needed to persist
and propagate the `language` field throughout the backend.

---

## 1. Database Migration

### Add `language` column to `audits` table

```sql
ALTER TABLE audits
ADD COLUMN language TEXT NOT NULL DEFAULT 'solidity';
```

**Rationale:** Every audit now has an associated language. The default ensures
backward compatibility with existing Solidity-only audits.

**Allowed values:** `'solidity'`, `'rust-solana'` (enforced at application level,
not via CHECK constraint, so new languages can be added without migration).

---

## 2. Edge Function Updates

### 2.1 `web-audit-start`

**Change:** Accept `language` in request body, store in audit record, include in
Cloud Run Job payload.

```typescript
// In the request body destructuring:
const { projectName, files, scope, additionalContext, language, idempotency_key } = body;

// When inserting the audit record:
const { data: audit } = await supabaseAdmin
  .from('audits')
  .insert({
    user_id: userId,
    project_name: projectName,
    status: 'queued',
    language: language || 'solidity',  // <-- NEW
    // ... other fields
  });

// When calling Cloud Run proxy /audit/run:
const payload = {
  sessionId: audit.id,
  userId,
  tier,
  scopeFiles,
  contextFiles,
  additionalContext,
  projectName,
  language: language || 'solidity',  // <-- NEW
};
```

### 2.2 `cli-audit-start`

**Change:** Accept `language` in request body, store in audit record, include in
GCS payload for Cloud Run Job.

Same pattern as `web-audit-start` — add `language` field to:
1. Request body parsing
2. Audit record insertion
3. GCS payload / Cloud Run Job trigger

### 2.3 `web-estimate` / `estimate-batch`

**Change:** Accept `language`, forward to Cloud Run proxy `/estimate` and
`/estimate/batch` endpoints.

```typescript
// Forward language to proxy:
const proxyPayload = {
  ...existingPayload,
  language: body.language || 'solidity',
};
```

### 2.4 `cli-audit-status` / `cli-audit-report`

**Change:** Include `language` field in response so clients know which language
the audit used.

```typescript
// When returning audit data:
return {
  ...auditData,
  language: audit.language,  // <-- NEW
};
```

### 2.5 `web-github-files`

**Change:** Accept `language`, filter returned files by language extensions.

```typescript
const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  'solidity': ['.sol'],
  'rust-solana': ['.rs'],
};

// When filtering GitHub tree entries:
const extensions = LANGUAGE_EXTENSIONS[body.language || 'solidity'] || ['.sol'];
const contextExtensions = ['.json', '.md', '.txt', '.toml'];
const allExtensions = [...extensions, ...contextExtensions];

const filteredFiles = treeEntries.filter(entry =>
  allExtensions.some(ext => entry.path.endsWith(ext))
);
```

### 2.6 `audit-session-ops`

**Change:** When verifying an audit session, include `language` in the returned
data so the Cloud Run proxy can use it.

```typescript
// In the 'verify' action response:
return new Response(JSON.stringify({
  status: row.status,
  tier: row.tier,
  language: row.language,  // <-- NEW
}));
```

---

## 3. RPC / Policy Updates

### `get_audit_access_context`

If this RPC returns audit metadata, add `language` to the returned fields.
No RLS policy changes needed — the `language` column has no security implications.

---

## 4. Testing Checklist

- [ ] Existing Solidity audits have `language = 'solidity'` after migration
- [ ] New audit with `language: 'rust-solana'` stores correctly
- [ ] `web-audit-start` passes `language` to Cloud Run proxy
- [ ] `cli-audit-start` passes `language` to Cloud Run proxy
- [ ] `web-estimate` forwards `language` to `/estimate/batch`
- [ ] `web-github-files` filters `.rs` files when `language: 'rust-solana'`
- [ ] `cli-audit-report` includes `language` in response
- [ ] Audit without `language` field defaults to `'solidity'`
