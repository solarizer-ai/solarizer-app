
Goal: make Scope reliably render files even when payload shape differs across audit flows, and prevent “No contract scope data available” when scope exists in any backend source.

What I found from recent telemetry/data:
- No recent browser console/network logs were captured in the preview session.
- Recent audit rows show:
  - `system_hologram` is almost always `{}` (object with no `scope/all_files`), so relying on it is not enough.
  - `scope_metadata` and `context_metadata` are usually JSON arrays, with keys like:
    - scope: `{ path, nLOC, complexity }`
    - context: `{ path, nLOC }`
- `audit_orchestration.request_payload` consistently contains `scopeFiles/contextFiles` for active/recent runs and can be used as a fallback source.
- Some historical audits have `scope_metadata/context_metadata = null`, so UI needs multi-source fallback.
- The screenshot symptom (“No contract scope data available”) is consistent with strict shape assumptions and missing fallback to orchestration payload.

Implementation plan:

1) Harden ScopeTab input normalization (primary fix)
- File: `src/components/ScopeTab.tsx`
- Replace direct array assumptions with robust normalizers:
  - Accept `null | undefined | array | object | JSON-string`.
  - Extract paths from multiple possible keys: `path`, `file`, `filePath`, `filename`.
  - Safely trim/validate strings; drop invalid/empty values.
  - Deduplicate paths.
- Build a single canonical source pipeline:
  1. `systemHologram.scope/all_files` (if valid non-empty arrays)
  2. `scopeMetadata/contextMetadata`
  3. orchestration payload fallback (`scopeFiles/contextFiles`) if passed
- Normalize status matching using canonicalized path comparison (lower risk of false mismatches from path prefixes/suffixes).
- Replace side-effect-in-`useMemo` (folder auto-expand) with `useEffect` to avoid unstable behavior and make updates predictable.
- Keep empty-state only when all normalized sources are empty after parsing.

2) Add orchestration payload fallback into ScopeTab props
- File: `src/components/ScopeTab.tsx`
- Extend props to accept optional orchestration payload (read-only shape), e.g.:
  - `orchestrationScopeFiles?: unknown`
  - `orchestrationContextFiles?: unknown`
- Use these only as tertiary fallback if audit row metadata/hologram is empty.

3) Expose request payload in audit progress hook
- File: `src/hooks/useAuditProgress.ts`
- Include `request_payload` in SELECT and interface typing.
- Keep existing polling behavior unchanged.
- This allows Report to pass fallback scope/context into ScopeTab when audit metadata is missing.

4) Wire fallback data from Report to ScopeTab
- File: `src/pages/Report.tsx`
- Pass:
  - `orchestrationScopeFiles={orchestration?.request_payload?.scopeFiles}`
  - `orchestrationContextFiles={orchestration?.request_payload?.contextFiles}`
- Make displayed contract count resilient:
  - Prefer `contract_count` if > 0
  - fallback to `contracts_total`
  - fallback to normalized scope file count (if both are missing/0)
- This addresses the “scope not registering” and “contracts showing 0 despite scope details” class of issues.

5) Type safety alignment for audit fields used by UI
- File: `src/hooks/useAudits.ts`
- Add optional fields used in UI fallback logic (e.g. `contracts_total`, `contracts_completed`) to avoid unsafe casting and brittle assumptions.

6) Defensive observability (dev-only)
- File: `src/components/ScopeTab.tsx`
- Add minimal guarded debug logs (only in development) when:
  - all sources are empty after normalization
  - data source used is fallback source
- This helps quickly diagnose future shape regressions without noisy production logs.

Validation plan (end-to-end):
1. Open a report where `system_hologram = {}` and `scope_metadata` is populated:
   - Scope tree renders files.
2. Open a report with `scope_metadata/context_metadata = null` but orchestration payload has `scopeFiles`:
   - Scope tree still renders (fallback source works).
3. Verify status chips:
   - completed audits show scoped files as analysed.
   - in-progress audits show pending/analysed transitions.
4. Confirm contract count no longer displays 0 when scope files exist.
5. Regression check:
   - audits with genuinely no scope data still show empty-state message.

Technical notes / risk controls:
- No database schema change required.
- No backend function change required for this fix.
- Main risk is over-normalization; mitigated by strict string/path validation and deterministic source precedence.
- Keep existing UI structure intact; only data parsing/fallback logic is hardened.
