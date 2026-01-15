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
import { getDefaultContent, getFolderPaths, pathExists } from "@/lib/sandpackUtils";

interface NewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: Record<string, { code: string }>;
  onCreateFile: (path: string, content: string) => void;
}

const FILE_TEMPLATES = [
  { ext: ".sol", label: "Solidity Contract" },
  { ext: ".json", label: "JSON" },
  { ext: ".md", label: "Markdown" },
  { ext: ".js", label: "JavaScript" },
  { ext: ".ts", label: "TypeScript" },
  { ext: ".txt", label: "Text File" },
];

export function NewFileDialog({
  open,
  onOpenChange,
  files,
  onCreateFile,
}: NewFileDialogProps) {
  const [fileName, setFileName] = useState("");
  const [parentFolder, setParentFolder] = useState("/");
  const [error, setError] = useState("");

  const folders = getFolderPaths(files);

  const handleCreate = () => {
    if (!fileName.trim()) {
      setError("File name is required");
      return;
    }

    // Validate file name
    const invalidChars = /[<>:"|?*\\]/;
    if (invalidChars.test(fileName)) {
      setError("File name contains invalid characters");
      return;
    }

    const fullPath =
      parentFolder === "/"
        ? `/${fileName}`
        : `${parentFolder}/${fileName}`;

    if (pathExists(files, fullPath)) {
      setError("A file with this name already exists");
      return;
    }

    const content = getDefaultContent(fileName);
    onCreateFile(fullPath, content);
    handleClose();
  };

  const handleClose = () => {
    setFileName("");
    setParentFolder("/");
    setError("");
    onOpenChange(false);
  };

  const handleTemplateClick = (ext: string) => {
    if (!fileName.includes(".")) {
      setFileName((prev) => (prev ? `${prev}${ext}` : `NewFile${ext}`));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              placeholder="e.g., Token.sol"
              value={fileName}
              onChange={(e) => {
                setFileName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {FILE_TEMPLATES.map((template) => (
                <Button
                  key={template.ext}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateClick(template.ext)}
                >
                  {template.label}
                </Button>
              ))}
            </div>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create File</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
