import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in-50", className)}>
            <div className="bg-muted/50 p-4 rounded-full mb-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
                {description}
            </p>
            {action && (
                <div className="flex gap-2">
                    {action}
                </div>
            )}
        </div>
    );
}
