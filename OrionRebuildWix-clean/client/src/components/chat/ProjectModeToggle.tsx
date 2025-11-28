import { Link2, Link2Off } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectModeToggleProps {
    isActive: boolean;
    forcesCount?: number;
    onToggle: () => void;
}

export function ProjectModeToggle({ isActive, forcesCount = 0, onToggle }: ProjectModeToggleProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/50 hover:bg-background transition-colors">
                        <div className="flex items-center gap-2">
                            {isActive ? (
                                <Link2 className="w-4 h-4 text-primary" />
                            ) : (
                                <Link2Off className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium">
                                {isActive ? "Project Mode" : "Standalone"}
                            </span>
                        </div>

                        {isActive && forcesCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {forcesCount} {forcesCount === 1 ? "force" : "forces"}
                            </Badge>
                        )}

                        <Switch
                            checked={isActive}
                            onCheckedChange={onToggle}
                            className="ml-2"
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs">
                        {isActive
                            ? "Project mode is active. I have access to your selected driving forces and project context."
                            : "Enable project mode to give me access to your project's driving forces and context."}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
