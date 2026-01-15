import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getFilesInFolder } from "@/lib/sandpackUtils";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string | null;
  files: Record<string, { code: string }>;
  onConfirmDelete: (paths: string[]) => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  filePath,
  files,
  onConfirmDelete,
}: DeleteConfirmDialogProps) {
  if (!filePath) return null;

  const fileName = filePath.split("/").pop() || filePath;
  
  // Check if this is a folder by seeing if any files are inside it
  const filesInFolder = getFilesInFolder(files, filePath);
  const isFolder = filesInFolder.length > 0;
  
  // If it's a file, just delete that file. If it's a folder, delete all files in it.
  const filesToDelete = isFolder ? filesInFolder : [filePath];

  const handleConfirm = () => {
    onConfirmDelete(filesToDelete);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {isFolder ? "Folder" : "File"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isFolder ? (
              <>
                Are you sure you want to delete the folder{" "}
                <span className="font-mono font-semibold text-foreground">
                  {fileName}
                </span>{" "}
                and all its contents?
                <br />
                <br />
                This will delete {filesInFolder.length} file
                {filesInFolder.length !== 1 ? "s" : ""}:
                <ul className="mt-2 max-h-32 overflow-auto text-xs font-mono bg-muted rounded p-2">
                  {filesInFolder.slice(0, 10).map((path) => (
                    <li key={path}>{path}</li>
                  ))}
                  {filesInFolder.length > 10 && (
                    <li className="text-muted-foreground">
                      ...and {filesInFolder.length - 10} more
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <>
                Are you sure you want to delete{" "}
                <span className="font-mono font-semibold text-foreground">
                  {fileName}
                </span>
                ? This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
