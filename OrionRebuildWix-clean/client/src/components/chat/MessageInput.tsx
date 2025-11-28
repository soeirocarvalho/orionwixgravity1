import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Square, ImageIcon, Paperclip } from "lucide-react";
import { FilePreviewCard } from "./FilePreviewCard";

interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    isStreaming: boolean;
    isProjectMode: boolean;
    selectedFiles: File[];
    selectedImages: File[];
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (index: number) => void;
    onRemoveImage: (index: number) => void;
    imagePreviews: string[];
}

export function MessageInput({
    value,
    onChange,
    onSend,
    onKeyDown,
    isStreaming,
    isProjectMode,
    selectedFiles,
    selectedImages,
    onFileUpload,
    onRemoveFile,
    onRemoveImage,
    imagePreviews
}: MessageInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const hasContent = value.trim() || selectedFiles.length > 0 || selectedImages.length > 0;

    return (
        <div className="space-y-3">
            {/* File Previews */}
            {(selectedFiles.length > 0 || selectedImages.length > 0) && (
                <div className="space-y-2">
                    {/* Image Previews */}
                    {selectedImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {selectedImages.map((image, idx) => (
                                <FilePreviewCard
                                    key={`image-${idx}`}
                                    file={image}
                                    type="image"
                                    preview={imagePreviews[idx]}
                                    onRemove={() => onRemoveImage(idx)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Document Previews */}
                    {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                            {selectedFiles.map((file, idx) => (
                                <FilePreviewCard
                                    key={`file-${idx}`}
                                    file={file}
                                    type="document"
                                    onRemove={() => onRemoveFile(idx)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Input Box */}
            <div className="relative flex items-end space-x-2">
                <div className="relative flex-1">
                    <Input
                        placeholder={
                            isProjectMode
                                ? "Message ORION with your project context..."
                                : "Message ORION in standalone mode..."
                        }
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={onKeyDown}
                        disabled={isStreaming}
                        className="pr-20 rounded-2xl border-border/50 focus:border-primary min-h-[48px] py-3"
                        data-testid="copilot-input"
                    />

                    {/* Upload Buttons */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => imageInputRef.current?.click()}
                            disabled={isStreaming}
                            data-testid="image-upload-button"
                            title="Upload images"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isStreaming}
                            data-testid="file-upload-button"
                            title="Upload files"
                        >
                            <Paperclip className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Hidden File Inputs */}
                    <input
                        ref={imageInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={onFileUpload}
                        accept="image/*"
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={onFileUpload}
                        accept=".txt,.pdf,.doc,.docx,.xlsx,.csv,.json"
                    />
                </div>

                {/* Send/Stop Button */}
                <Button
                    onClick={isStreaming ? () => { } : onSend}
                    disabled={!isStreaming && !hasContent}
                    size="icon"
                    variant={isStreaming ? "destructive" : "default"}
                    className="rounded-full h-12 w-12"
                    data-testid="copilot-send"
                    title={isStreaming ? "Stop generating" : "Send message"}
                >
                    {isStreaming ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    );
}
