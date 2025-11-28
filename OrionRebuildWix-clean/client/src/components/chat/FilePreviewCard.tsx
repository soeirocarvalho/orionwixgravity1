import { X, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilePreviewCardProps {
    file: File;
    type: "image" | "document";
    onRemove: () => void;
    preview?: string; // Base64 preview for images
}

export function FilePreviewCard({ file, type, onRemove, preview }: FilePreviewCardProps) {
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    return (
        <div
            className={cn(
                "relative group flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50",
                "hover:bg-background hover:border-border transition-colors"
            )}
        >
            {/* Preview/Icon */}
            <div className="flex-shrink-0">
                {type === "image" && preview ? (
                    <img
                        src={preview}
                        alt={file.name}
                        className="w-12 h-12 rounded object-cover"
                    />
                ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        {type === "image" ? (
                            <FileImage className="w-6 h-6 text-muted-foreground" />
                        ) : (
                            <FileText className="w-6 h-6 text-muted-foreground" />
                        )}
                    </div>
                )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                </p>
            </div>

            {/* Remove Button */}
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onRemove}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
