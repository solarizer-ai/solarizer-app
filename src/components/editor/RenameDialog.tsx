import { useState, useEffect } from "react";
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
import { pathExists } from "@/lib/sandpackUtils";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string | null;
  files: Record<string, { code: string }>;
  onRename: (oldPath: string, newPath: string) => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  currentPath,
  files,
  onRename,
}: RenameDialogProps) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const currentName = currentPath?.split("/").pop() || "";
  const parentPath = currentPath?.substring(0, currentPath.lastIndexOf("/")) || "";

  useEffect(() => {
    if (open && currentName) {
      setNewName(currentName);
    }
  }, [open, currentName]);

  const handleRename = () => {
    if (!newName.trim()) {
      setError("Name is required");
      return;
    }

    if (newName === currentName) {
      handleClose();
      return;
    }

    // Validate name
    const invalidChars = /[<>:"|?*\\]/;
    if (invalidChars.test(newName)) {
      setError("Name contains invalid characters");
      return;
    }

    const newPath = parentPath ? `${parentPath}/${newName}` : `/${newName}`;

    if (pathExists(files, newPath)) {
      setError("A file with this name already exists");
      return;
    }

    if (currentPath) {
      onRename(currentPath, newPath);
    }
    handleClose();
  };

  const handleClose = () => {
    setNewName("");
    setError("");
    onOpenChange(false);
  };

  if (!currentPath) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="currentName">Current Name</Label>
            <Input id="currentName" value={currentName} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newName">New Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {parentPath && (
            <p className="text-sm text-muted-foreground">
              Location: <span className="font-mono">{parentPath}/</span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleRename}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
