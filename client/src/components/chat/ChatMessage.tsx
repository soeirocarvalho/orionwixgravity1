import { User } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import type { ChatImage } from "@shared/schema";

interface ChatMessageProps {
    message: {
        id: string;
        role: "user" | "assistant" | "system";
        content: string;
        timestamp: Date;
        files?: File[];
        images?: ChatImage[];
    };
    isStreaming?: boolean;
    formatFileSize: (bytes: number) => string;
}

export function ChatMessage({ message, isStreaming, formatFileSize }: ChatMessageProps) {
    const isUser = message.role === "user";

    return (
        <div
            className={cn(
                "flex gap-3 group",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            {/* Avatar */}
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-sm font-medium",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                )}
            >
                {isUser ? (
                    <User className="h-4 w-4" />
                ) : (
                    <span className="font-bold">O</span>
                )}
            </div>

            {/* Message Content */}
            <div
                className={cn(
                    "flex flex-col space-y-2 max-w-[80%]",
                    isUser ? "items-end" : "items-start"
                )}
            >
                <div
                    className={cn(
                        "rounded-2xl px-4 py-3",
                        isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                    )}
                >
                    {message.role === "user" ? (
                        <p className="whitespace-pre-wrap break-words text-sm">
                            {message.content}
                        </p>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="mb-2 ml-4 list-disc space-y-1" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="mb-2 ml-4 list-decimal space-y-1" {...props} />,
                                    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                                    h1: ({ node, ...props }) => <h1 className="mb-2 mt-4 text-xl font-bold first:mt-0" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="mb-2 mt-3 text-lg font-bold first:mt-0" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="mb-2 mt-3 text-base font-bold first:mt-0" {...props} />,
                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary pl-4 italic my-2" {...props} />,
                                    code: ({ node, ...props }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm" {...props} />,
                                    pre: ({ node, ...props }) => <pre className="my-2 overflow-x-auto rounded-lg bg-muted p-4" {...props} />,
                                    a: ({ node, ...props }) => {
                                        const href = props.href || '';
                                        const isExternal = href.startsWith('http://') || href.startsWith('https://');
                                        return (
                                            <a
                                                className="text-primary underline hover:text-primary/80"
                                                {...props}
                                                target={isExternal ? "_blank" : undefined}
                                                rel={isExternal ? "noopener noreferrer" : undefined}
                                            />
                                        );
                                    },
                                    table: ({ node, ...props }) => <table className="my-2 w-full border-collapse" {...props} />,
                                    th: ({ node, ...props }) => <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props} />,
                                    td: ({ node, ...props }) => <td className="border border-border px-4 py-2" {...props} />,
                                    img: ({ node, ...props }) => {
                                        const src = props.src || '';
                                        const token = localStorage.getItem('auth_token');
                                        const authenticatedSrc = src.startsWith('/api/') && token
                                            ? `${src}${src.includes('?') ? '&' : '?'}token=${token}`
                                            : src;

                                        const isExternal = src.startsWith('http://') || src.startsWith('https://');

                                        return (
                                            <img
                                                className="my-2 max-w-full rounded-lg border border-border/20 shadow-sm"
                                                {...props}
                                                src={authenticatedSrc}
                                                alt={props.alt || "Generated visualization"}
                                                loading="lazy"
                                                referrerPolicy={isExternal ? "no-referrer" : undefined}
                                                onError={(e) => console.error('[ChatMessage] Image load failed:', authenticatedSrc, e)}
                                            />
                                        );
                                    },
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                    {message.role === "assistant" && isStreaming && message.content === "" && (
                        <span className="inline-block w-2 h-4 bg-current animate-pulse">|</span>
                    )}
                </div>

                {/* Image attachments */}
                {message.images && message.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {message.images.map((image, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={`data:${image.type};base64,${image.data}`}
                                    alt={image.name}
                                    className="rounded-lg max-w-full h-auto max-h-64 object-contain border border-border/20"
                                    data-testid={`message-image-${idx}`}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
                                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {image.name} ({formatFileSize(image.size)})
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* File attachments */}
                {message.files && message.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {message.files.map((file, idx) => (
                            <div key={idx} className="text-xs bg-background/20 rounded px-2 py-1 flex items-center space-x-1">
                                <span>{file.name}</span>
                                <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
