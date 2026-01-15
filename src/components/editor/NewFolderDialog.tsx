import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFolderPaths } from "@/lib/sandpackUtils";

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: Record<string, { code: string }>;
  onCreateFolder: (path: string) => void;
}

export function NewFolderDialog({
  open,
  onOpenChange,
  files,
  onCreateFolder,
}: NewFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const [parentFolder, setParentFolder] = useState("/");
  const [error, setError] = useState("");

  const folders = getFolderPaths(files);

  const handleCreate = () => {
    if (!folderName.trim()) {
      setError("Folder name is required");
      return;
    }

    // Validate folder name
    const invalidChars = /[<>:"|?*\\/]/;
    if (invalidChars.test(folderName)) {
      setError("Folder name contains invalid characters");
      return;
    }

    const fullPath =
      parentFolder === "/"
        ? `/${folderName}`
        : `${parentFolder}/${folderName}`;

    // Check if folder already exists (by checking if any file starts with this path)
    const folderExists = Object.keys(files).some(
      (path) => path.toLowerCase().startsWith(fullPath.toLowerCase() + "/")
    );

    if (folderExists) {
      setError("A folder with this name already exists");
      return;
    }

    onCreateFolder(fullPath);
    handleClose();
  };

  const handleClose = () => {
    setFolderName("");
    setParentFolder("/");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              placeholder="e.g., contracts"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentFolder">Parent Folder</Label>
            <Select value={parentFolder} onValueChange={setParentFolder}>
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder} value={folder}>
                    {folder === "/" ? "/ (root)" : folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            A placeholder file will be created inside the folder. You can delete
            it after adding your own files.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Folder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
