import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileCode, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  name: string;
  size: number;
  content?: string;
}

interface FileUploaderProps {
  onFilesSelected: (files: UploadedFile[]) => void;
}

const FileUploader = ({ onFilesSelected }: FileUploaderProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = [];
    
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newFiles.push({
          name: file.name,
          size: file.size,
          content: reader.result as string,
        });
        
        if (newFiles.length === acceptedFiles.length) {
          setFiles((prev) => [...prev, ...newFiles]);
          onFilesSelected([...files, ...newFiles]);
        }
      };
      reader.readAsText(file);
    });
  }, [files, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".sol"],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            isDragActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? "Drop your files here" : "Drag & drop Solidity files"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse • .sol files only
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Uploaded Files ({files.length})
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-7"
              onClick={() => {
                setFiles([]);
                onFilesSelected([]);
              }}
            >
              Clear all
            </Button>
          </div>
          
          <div className="space-y-1.5">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2.5 group"
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <FileCode className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <button
                    onClick={() => removeFile(index)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-critical hover:bg-critical/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
