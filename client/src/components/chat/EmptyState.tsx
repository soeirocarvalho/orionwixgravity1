import { Sparkles, Link2, FileText, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
    isProjectMode: boolean;
    onPromptClick: (prompt: string) => void;
}

const STANDALONE_PROMPTS = [
    "What is strategic foresight?",
    "Explain the STEEP framework",
    "How do I identify weak signals?",
    "What are driving forces in futures thinking?"
];

const PROJECT_PROMPTS = [
    "Summarize the key driving forces",
    "What are the most impactful trends?",
    "Identify potential wildcards",
    "Analyze the selected forces"
];

export function EmptyState({ isProjectMode, onPromptClick }: EmptyStateProps) {
    const prompts = isProjectMode ? PROJECT_PROMPTS : STANDALONE_PROMPTS;

    return (
        <div className="flex flex-col items-center justify-center h-full px-4 py-12">
            <Card className="max-w-2xl w-full p-8 bg-gradient-to-br from-background to-muted/20 border-border/50">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        Welcome to ORION
                    </h2>
                    <p className="text-muted-foreground">
                        {isProjectMode
                            ? "Your AI assistant with project context"
                            : "Your strategic intelligence assistant"}
                    </p>
                </div>

                {/* Mode Indicator */}
                {isProjectMode && (
                    <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-2 text-sm">
                            <Link2 className="w-4 h-4 text-primary" />
                            <span className="font-medium">Project Mode Active</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            I have access to your selected driving forces and project context
                        </p>
                    </div>
                )}

                {/* Suggested Prompts */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Try asking:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {prompts.map((prompt, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="justify-start text-left h-auto py-3 px-4 hover:bg-primary/5 hover:border-primary/50"
                                onClick={() => onPromptClick(prompt)}
                            >
                                <span className="text-sm">{prompt}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Features */}
                <div className="pt-6 border-t border-border/50">
                    <h3 className="text-sm font-semibold mb-3">What I can help with:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Analyze documents and images</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Generate insights and summaries</span>
                        </div>
                        {isProjectMode && (
                            <>
                                <div className="flex items-start gap-2">
                                    <Link2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Work with your driving forces</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Provide strategic recommendations</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
