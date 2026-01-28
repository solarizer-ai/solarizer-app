

# Fix Scope Tab Data Loss on Analysis Completion

## Problem

When an analysis completes, the Scope tab shows "No contract scope data available" because the `system_hologram` data is being **overwritten** instead of **merged**.

### Root Cause

1. **When analysis starts** (`run-audit` function): The `scope` and `all_files` arrays are correctly saved to `system_hologram`
2. **When analysis completes** (`complete-audit` function): The n8n backend sends a different `system_hologram` structure containing analysis metadata
3. The current code **replaces** the entire `system_hologram`, losing the `scope` and `all_files` arrays

---

## Solution

Merge the incoming `system_hologram` with the existing one, preserving the `scope` and `all_files` arrays while adding new analysis metadata. Skip the update entirely if the incoming data is an exact duplicate.

---

## Technical Changes

### File: `supabase/functions/complete-audit/index.ts`

Modify the `system_hologram` handling to:
1. Fetch existing `system_hologram` from the database
2. Check if incoming data is an exact duplicate of existing - if so, skip update
3. Merge incoming data with existing, preserving `scope` and `all_files`

**Implementation:**
```typescript
// Merge system_hologram to preserve scope/all_files from run-audit
if (system_hologram !== undefined) {
  // Fetch existing system_hologram to preserve scope metadata
  const { data: existingAudit, error: hologramFetchError } = await supabase
    .from('audits')
    .select('system_hologram')
    .eq('id', audit_id)
    .single();
  
  if (hologramFetchError) {
    console.error('complete-audit: Failed to fetch existing system_hologram:', hologramFetchError);
  }
  
  const existingHologram = existingAudit?.system_hologram || {};
  
  // Check for exact duplicate - skip if incoming matches what we already have
  const incomingKeys = Object.keys(system_hologram);
  const isExactDuplicate = incomingKeys.every(key => {
    return JSON.stringify(existingHologram[key]) === JSON.stringify(system_hologram[key]);
  });
  
  if (isExactDuplicate && incomingKeys.length > 0) {
    console.log('complete-audit: Skipping system_hologram update - exact duplicate detected');
  } else {
    // Merge: preserve existing scope/all_files, add new analysis data
    updateData.system_hologram = {
      ...existingHologram,    // Keeps scope, all_files
      ...system_hologram,     // Adds/updates contracts, entry_points, etc.
    };
    console.log('complete-audit: Merged system_hologram - preserved scope/all_files');
  }
}
```

---

## Result

After the fix:
- **First completion**: Merges analysis data with existing scope data
- **Duplicate callbacks**: Skipped entirely, no unnecessary updates
- **Final `system_hologram`** contains both scope metadata AND analysis data:
  ```json
  {
    "scope": ["file1.sol", "file2.sol"],
    "all_files": ["file1.sol", "file2.sol", "lib.sol"],
    "contracts": [...],
    "entry_points": [...],
    "external_calls": 0,
    "state_variables": 0
  }
  ```

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| `system_hologram` update | Full replacement | Merge with existing |
| Duplicate handling | Overwrites anyway | Skipped entirely |
| `scope` array | Lost on completion | Preserved |
| `all_files` array | Lost on completion | Preserved |
| Scope tab after completion | Empty | Shows file tree |

