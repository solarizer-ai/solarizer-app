

# Allow File Removal After GitHub Import

Currently, after GitHub import, files go straight to the scope step with no way to remove individual files. The folder upload flow shows files in `FolderUploader` with per-file remove buttons and an "Add More" option. We need the same experience for GitHub imports.

## Approach

Instead of skipping the input step after GitHub import, show the imported files in the same `FolderUploader` view (which already supports file tree rendering with remove buttons).

### Changes

**`src/components/AuditWizard.tsx`**
- Change `handleGitHubFilesImported` to set files and stay on the `input` step (instead of jumping to `scope`)
- The existing `input` step for `github` only shows `GitHubImportStep`. Add a condition: if files are already loaded and method is `github`, show `FolderUploader` in its "uploaded files" state (with the file tree, remove buttons, and Continue button) — same as the folder flow
- This reuses the existing `FolderUploader` component which already has `renderTree`, `handleRemoveFile`, "Add More", and "Clear" functionality

**Concrete change in the JSX:**
```
{step === 'input' && uploadMethod === 'github' && (
  files.length === 0
    ? <GitHubImportStep onFilesImported={...} onBack={handleBack} />
    : <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2>Imported from GitHub</h2>
          <p>Review your files before continuing</p>
        </div>
        <FolderUploader
          onFilesUploaded={setFiles}
          uploadedFiles={files}
          onClear={() => setFiles([])}
        />
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => { setFiles([]); }}>
            <ArrowLeft /> Re-import
          </Button>
          <Button onClick={handleProceedToScope} disabled={getAllFiles(files).length === 0}>
            <Play /> Continue
          </Button>
        </div>
      </div>
)}
```

This gives GitHub-imported files the exact same remove/clear UX as folder uploads with zero new components.

