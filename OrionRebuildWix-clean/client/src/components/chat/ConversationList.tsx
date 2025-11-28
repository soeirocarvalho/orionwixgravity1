import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday, subDays, isAfter } from "date-fns";
import { MessageSquare, Plus, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
    id: string;
    title: string;
    updatedAt: string;
}

interface ConversationListProps {
    projectId: string;
    currentConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
}

export function ConversationList({
    projectId,
    currentConversationId,
    onSelectConversation,
    onNewChat,
}: ConversationListProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: conversations = [] } = useQuery<Conversation[]>({
        queryKey: ["/api/v1/projects", projectId, "conversations"],
        enabled: !!projectId,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/v1/conversations/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/v1/projects", projectId, "conversations"] });
            toast({
                title: "Conversation deleted",
            });
            if (currentConversationId) {
                onNewChat();
            }
        },
        onError: () => {
            toast({
                title: "Failed to delete conversation",
                variant: "destructive",
            });
        },
    });

    const groupConversations = (conversations: Conversation[]) => {
        const groups: Record<string, Conversation[]> = {
            "Today": [],
            "Yesterday": [],
            "Previous 7 Days": [],
            "Older": [],
        };

        conversations.forEach((conv) => {
            const date = new Date(conv.updatedAt);
            if (isToday(date)) {
                groups["Today"].push(conv);
            } else if (isYesterday(date)) {
                groups["Yesterday"].push(conv);
            } else if (isAfter(date, subDays(new Date(), 7))) {
                groups["Previous 7 Days"].push(conv);
            } else {
                groups["Older"].push(conv);
            }
        });

        return groups;
    };

    const groupedConversations = groupConversations(conversations);

    return (
        <div className="flex flex-col h-full border-r bg-muted/10 w-64">
            <div className="p-4 border-b">
                <Button
                    onClick={onNewChat}
                    className="w-full justify-start gap-2"
                    variant="outline"
                >
                    <Plus className="h-4 w-4" />
                    New Chat
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-4">
                    {Object.entries(groupedConversations).map(([label, convs]) => (
                        convs.length > 0 && (
                            <div key={label}>
                                <h3 className="px-2 text-xs font-medium text-muted-foreground mb-2">
                                    {label}
                                </h3>
                                <div className="space-y-1">
                                    {convs.map((conv) => (
                                        <div
                                            key={conv.id}
                                            className={cn(
                                                "group flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                                currentConversationId === conv.id && "bg-accent text-accent-foreground"
                                            )}
                                            onClick={() => onSelectConversation(conv.id)}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <MessageSquare className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{conv.title}</span>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreHorizontal className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteMutation.mutate(conv.id);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}

                    {conversations.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-4">
                            No conversations yet
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
