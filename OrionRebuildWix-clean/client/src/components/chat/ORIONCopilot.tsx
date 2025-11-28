import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  FileText
} from "lucide-react";
import type { ChatImage, DrivingForce } from "@shared/schema";
import { useOrionCopilotProjectMode, useOrionCopilotThreadId, useAppActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConversationList } from "./ConversationList";
import { ChatMessage as ChatMessageComponent } from "./ChatMessage";
import { MessageInput } from "./MessageInput";
import { EmptyState } from "./EmptyState";
import { ProjectModeToggle } from "./ProjectModeToggle";
import { useImagePreviews } from "@/hooks/useImagePreviews";
import { cn } from "@/lib/utils";

interface ORIONCopilotProps {
  projectId?: string;
  className?: string;
  projectData?: {
    project?: any;
    forcesCount?: number;
    clustersCount?: number;
    recentForces?: DrivingForce[];
    viewMode?: string;
    selectedForces?: any[];
    selectedForcesCount?: number;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  files?: File[];
  images?: ChatImage[];
  threadId?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export function ORIONCopilot({ projectId, className, projectData }: ORIONCopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const imagePreviews = useImagePreviews(selectedImages);

  // Use global store for project mode and thread state
  const isProjectModeActive = useOrionCopilotProjectMode();
  const threadId = useOrionCopilotThreadId();
  const { setOrionCopilotProjectMode, setOrionCopilotThreadId } = useAppActions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && projectId) {
      return localStorage.getItem(`orion_last_conversation_${projectId}`);
    }
    return null;
  });

  // Persist active conversation
  useEffect(() => {
    if (projectId) {
      if (currentConversationId) {
        localStorage.setItem(`orion_last_conversation_${projectId}`, currentConversationId);
      } else {
        localStorage.removeItem(`orion_last_conversation_${projectId}`);
      }
    }
  }, [projectId, currentConversationId]);

  // Save message mutation
  const saveMessageMutation = useMutation({
    mutationFn: async (newMessages: ChatMessage[]) => {
      if (!projectData?.project?.id) {
        console.log('[SaveMutation] No project ID, skipping save');
        return;
      }

      // Sanitize messages: remove File objects which are not serializable
      const messagesToSave = newMessages
        .filter(m => m.id !== 'welcome')
        .map(m => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { files, ...rest } = m;
          return rest;
        });

      console.log('[SaveMutation] Saving conversation:', {
        projectId: projectData.project.id,
        currentConversationId,
        messageCount: messagesToSave.length,
        messages: messagesToSave
      });

      if (!currentConversationId) {
        // Create new conversation
        const firstUserMsg = messagesToSave.find(m => m.role === 'user');
        const title = firstUserMsg ? (firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "")) : "New Chat";

        const res = await apiRequest("POST", `/api/v1/projects/${projectData.project.id}/conversations`, {
          title,
          messages: messagesToSave,
        });
        const data = await res.json();
        console.log('[SaveMutation] Created conversation:', data.id);
        setCurrentConversationId(data.id);
        queryClient.invalidateQueries({ queryKey: ["/api/v1/projects", projectData.project.id, "conversations"] });
      } else {
        // Update existing conversation
        try {
          await apiRequest("PUT", `/api/v1/conversations/${currentConversationId}`, {
            messages: messagesToSave,
          });
          console.log('[SaveMutation] Updated conversation:', currentConversationId);
          queryClient.invalidateQueries({ queryKey: ["/api/v1/projects", projectData.project.id, "conversations"] });
        } catch (error: any) {
          // If conversation not found (404), create a new one instead
          if (error.message && error.message.includes('404')) {
            console.log('[SaveMutation] Conversation not found (404), creating new one instead');

            const firstUserMsg = messagesToSave.find(m => m.role === 'user');
            const title = firstUserMsg ? (firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "")) : "New Chat";

            const res = await apiRequest("POST", `/api/v1/projects/${projectData.project.id}/conversations`, {
              title,
              messages: messagesToSave,
            });
            const data = await res.json();
            console.log('[SaveMutation] Re-created conversation:', data.id);
            setCurrentConversationId(data.id);
            queryClient.invalidateQueries({ queryKey: ["/api/v1/projects", projectData.project.id, "conversations"] });
            return;
          }
          throw error;
        }
      }
    },
    onError: (error) => {
      console.error('[SaveMutation] Error:', error);
    },
  });

  // Abort controller for stopping streams
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevProjectIdRef = useRef(projectId);


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch messages when a conversation is selected
  const { data: selectedConversation } = useQuery({
    queryKey: ["/api/v1/conversations", currentConversationId],
    queryFn: async () => {
      if (!currentConversationId) return null;
      console.log('[ORIONCopilot] Fetching conversation:', currentConversationId);
      const res = await apiRequest("GET", `/api/v1/conversations/${currentConversationId}`);
      const data = await res.json();
      console.log('[ORIONCopilot] Fetched conversation data:', data);
      return data;
    },
    enabled: !!currentConversationId,
  });

  useEffect(() => {
    console.log('[ORIONCopilot] selectedConversation changed:', selectedConversation);
    if (selectedConversation) {
      console.log('[ORIONCopilot] selectedConversation.messages:', selectedConversation.messages);
      if (selectedConversation.messages && Array.isArray(selectedConversation.messages)) {
        console.log('[ORIONCopilot] Setting messages from selected conversation, count:', selectedConversation.messages.length);
        // Ensure dates are Date objects
        const parsedMessages = selectedConversation.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        console.log('[ORIONCopilot] Parsed messages:', parsedMessages);
        setMessages(parsedMessages);
        // Restore thread ID if available
        if (parsedMessages.length > 0) {
          const lastMsg = parsedMessages[parsedMessages.length - 1];
          if (lastMsg.threadId) {
            setOrionCopilotThreadId(lastMsg.threadId);
          }
        }
      } else {
        console.error('[ORIONCopilot] selectedConversation.messages is not an array or is missing!', selectedConversation);
      }
    }
  }, [selectedConversation]);

  // Initialize welcome message (only when truly starting fresh)
  useEffect(() => {
    console.log('[ORIONCopilot] Welcome message check:', { messagesLength: messages.length, currentConversationId, hasSelectedConversation: !!selectedConversation });
    if (messages.length === 0 && !currentConversationId && !selectedConversation) {
      console.log('[ORIONCopilot] Setting welcome message');
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Welcome to ORION, your Strategic Foresight & Innovation copilot.\n\nTo tailor this journey, please tell me:\n• your strategic focus (the topic, issue or decision you want to explore), and\n• your time horizon (for example, 2030, 2040, 2050).",
        timestamp: new Date(),
      }]);
    }
  }, [messages.length, currentConversationId, selectedConversation]);

  // Reset mode and thread when project changes to prevent cross-project bleed
  useEffect(() => {
    if (projectId && projectId !== prevProjectIdRef.current) {
      // Reset to standalone mode and clear thread when project changes
      setOrionCopilotProjectMode(false);
      setOrionCopilotThreadId(null);

      const savedId = localStorage.getItem(`orion_last_conversation_${projectId}`);
      if (savedId) {
        console.log('[ORIONCopilot] Restoring conversation:', savedId);
        setCurrentConversationId(savedId);
      } else {
        setCurrentConversationId(null);
      }

      setMessages([]);
      prevProjectIdRef.current = projectId;
    }
  }, [projectId, setOrionCopilotProjectMode, setOrionCopilotThreadId]);





  // Save conversation when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      const messagesToSave = messages.filter(m => m.id !== 'welcome');
      if (messagesToSave.length > 0 && projectData?.project?.id) {
        // Fire-and-forget is OK here since component is unmounting
        saveMessageMutation.mutate(messagesToSave);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  const getWelcomeMessage = (data?: any) => {
    return `Just say Hi or Hello to start!`;
  };


  // Image utilities
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:image/...;base64, prefix to get just the base64 data
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const imageFiles = newFiles.filter(isImageFile);
      const documentFiles = newFiles.filter(f => !isImageFile(f));

      setSelectedImages(prev => [...prev, ...imageFiles]);
      setSelectedFiles(prev => [...prev, ...documentFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const buildContextForAssistant = () => {
    if (!isProjectModeActive || !projectData) {
      return {
        integrationMode: 'standalone',
        projectId: null,
        context: 'copilot'
      };
    }

    const selectedForcesCount = projectData?.selectedForcesCount || 0;
    const selectedForcesAvailable = projectData?.selectedForces?.length || 0;

    // SECURITY: Send only force IDs, let backend fetch full content server-side
    const ASSISTANT_FORCES_LIMIT = Math.min(50, selectedForcesAvailable);
    const selectedForceIds = projectData?.selectedForces?.slice(0, ASSISTANT_FORCES_LIMIT).map((force: any) => force.id) || [];

    console.log('[ORIONCopilot] Building secure context for assistant:', {
      integrationMode: 'project',
      projectId,
      selectedForcesCount,
      forceIds: selectedForceIds.length,
      sampleIds: selectedForceIds.slice(0, 3)
    });

    return {
      integrationMode: 'project',
      projectId,
      context: 'copilot',
      selectedForceIds: selectedForceIds, // SECURITY: Send only IDs, not full content
      selectedForcesCount: selectedForcesCount,
      viewMode: projectData?.viewMode,
    };
  };

  // Toggle project mode
  const toggleProjectMode = () => {
    setOrionCopilotProjectMode(!isProjectModeActive);

    // Update welcome message when mode changes
    if (messages.length > 0 && messages[0].id === 'welcome') {
      const welcomeContent = getWelcomeMessage(projectData);

      setMessages(prev => {
        const updatedMessages = [...prev];
        updatedMessages[0] = {
          ...updatedMessages[0],
          content: welcomeContent,
          timestamp: new Date(),
        };
        return updatedMessages;
      });
    }
  };

  // Check for user commands to activate project mode
  const checkForProjectCommands = (content: string) => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('use my selected forces') ||
      lowerContent.includes('integrate my forces') ||
      lowerContent.includes('use project forces')) {
      if (!isProjectModeActive && projectData?.selectedForcesCount && projectData.selectedForcesCount > 0) {
        setOrionCopilotProjectMode(true);
        return true;
      }
    }
    return false;
  };

  const sendMessage = async (customContent?: string) => {
    const messageContent = customContent || input.trim();
    if ((!messageContent && selectedFiles.length === 0 && selectedImages.length === 0) || isStreaming) return;

    // Check if user is requesting project integration
    const activatedProjectMode = checkForProjectCommands(messageContent);

    // Convert images to base64
    let chatImages: ChatImage[] = [];
    if (selectedImages.length > 0) {
      try {
        chatImages = await Promise.all(
          selectedImages.map(async (file) => ({
            data: await convertImageToBase64(file),
            type: file.type,
            name: file.name,
            size: file.size,
          }))
        );
      } catch (error) {
        console.error('Error converting images:', error);
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent || (selectedImages.length > 0 ? "[Images uploaded]" : "[Files uploaded]"),
      timestamp: new Date(),
      files: selectedFiles.length > 0 ? [...selectedFiles] : undefined,
      images: chatImages.length > 0 ? chatImages : undefined
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setSelectedFiles([]);
    setSelectedImages([]);
    setIsStreaming(true); // Keep streaming true for the duration of the assistant response

    // Save user message immediately
    saveMessageMutation.mutate(newMessages);

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const assistantContext = buildContextForAssistant();

      // Use POST method for better support of Assistant API
      const response = await fetch('/api/v1/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          project_id: projectId || null, // Allow null for standalone mode
          query: messageContent,
          assistant_type: 'copilot',
          thread_id: threadId,
          mode: 'general',
          context: assistantContext,
          images: chatImages.length > 0 ? chatImages : undefined
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to start chat stream');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk") {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: msg.content + data.content }
                      : msg
                  )
                );
              } else if (data.type === "done") {
                if (data.threadId) {
                  setOrionCopilotThreadId(data.threadId);
                }
                setIsStreaming(false);

                // Save conversation after assistant response completes
                // Use setTimeout to ensure state has updated
                setTimeout(() => {
                  setMessages(currentMessages => {
                    const messagesToSave = currentMessages.filter(m => m.id !== 'welcome');
                    if (messagesToSave.length > 0 && projectData?.project?.id) {
                      console.log('[ORIONCopilot] Auto-saving after assistant response, message count:', messagesToSave.length);
                      saveMessageMutation.mutate(messagesToSave);
                    }
                    return currentMessages; // Return unchanged to avoid re-render
                  });
                }, 100);

                break;
              } else if (data.type === "error") {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: "I apologize, but I encountered an error. Please try again." }
                      : msg
                  )
                );
                setIsStreaming(false);
                break;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Stream was cancelled by user
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: msg.content + "\n\n[Response stopped by user]" }
              : msg
          )
        );
      } else {
        console.error('Chat stream error:', error);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: "I apologize, but I encountered an error. Please try again." }
              : msg
          )
        );
      }
      setIsStreaming(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleNewChat = async () => {
    // Save current conversation before clearing if there are messages
    const messagesToSave = messages.filter(m => m.id !== 'welcome');
    if (messagesToSave.length > 0 && projectData?.project?.id) {
      try {
        await saveMessageMutation.mutateAsync(messagesToSave);
      } catch (error) {
        console.error('Failed to save conversation:', error);
        toast({
          title: "Warning: Save Failed",
          description: "Previous conversation could not be saved, but starting new chat.",
          variant: "destructive",
        });
        // Proceed anyway to ensure user isn't stuck
      }
    }

    // Then clear state for new chat (only after save completes)
    setOrionCopilotThreadId(null);
    setCurrentConversationId(null);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Welcome to ORION, your Strategic Foresight & Innovation copilot.\n\nTo tailor this journey, please tell me:\n• your strategic focus (the topic, issue or decision you want to explore), and\n• your time horizon (for example, 2030, 2040, 2050).",
      timestamp: new Date(),
    }]);
    setSelectedFiles([]);
    setSelectedImages([]);
    toast({
      title: "New Chat Started",
      description: messagesToSave.length > 0 ? "Previous conversation saved." : "Context has been cleared.",
    });
  };

  return (
    <div className={cn("flex h-full bg-background", className)}>
      {projectData?.project?.id && (
        <ConversationList
          projectId={projectData.project.id}
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversationId}
          onNewChat={handleNewChat}
        />
      )}

      <div className="flex-1 flex flex-col h-full min-w-0">
        <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <EmptyState
                isProjectMode={isProjectModeActive}
                onPromptClick={(prompt) => sendMessage(prompt)}
              />
            ) : (
              messages.map((message) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming}
                  formatFileSize={formatFileSize}
                />
              ))
            )}
          </div>
        </ScrollArea >

        {/* Input Area */}
        <div className="border-t border-border/50 p-4">
          <div className="max-w-3xl mx-auto">
            {/* Persistent Mode Status Badge & Actions */}
            <div className="mb-3 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    if (!projectData?.project?.id) {
                      toast({
                        title: "No Project Selected",
                        description: "Please select a project to generate a report.",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Filter out system messages and ensure content is valid
                    const chatHistory = messages.filter(m => m.role !== 'system').map(m => ({
                      role: m.role,
                      content: m.content,
                      timestamp: m.timestamp
                    }));

                    if (chatHistory.length === 0) {
                      toast({
                        title: "Empty Conversation",
                        description: "Start a conversation before generating a report.",
                        variant: "destructive",
                      });
                      return;
                    }

                    await apiRequest("POST", "/api/v1/reports", {
                      projectId: projectData.project.id,
                      format: "pdf",
                      reportType: "chat",
                      chatHistory: chatHistory,
                      status: "pending"
                    });

                    toast({
                      title: "Report Generation Started",
                      description: "Your chat report is being generated. Check the Reports page.",
                    });
                  } catch (error) {
                    console.error("Failed to generate report:", error);
                    toast({
                      title: "Generation Failed",
                      description: "Failed to start report generation. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="shrink-0"
                title="Generate a report from this conversation"
              >
                <FileText className="w-3 h-3 mr-1" />
                Generate Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="shrink-0"
                title="Start a new chat session"
              >
                <Plus className="w-3 h-3 mr-1" />
                New Chat
              </Button>
            </div>

            {/* Project Mode Toggle */}
            {projectData?.project && (
              <div className="mb-3 flex justify-center">
                <ProjectModeToggle
                  isActive={isProjectModeActive}
                  forcesCount={projectData?.selectedForcesCount}
                  onToggle={toggleProjectMode}
                />
              </div>
            )}

            {/* Message Input */}
            <MessageInput
              value={input}
              onChange={setInput}
              onSend={() => isStreaming ? stopStreaming() : sendMessage()}
              onKeyDown={handleKeyDown}
              isStreaming={isStreaming}
              isProjectMode={isProjectModeActive}
              selectedFiles={selectedFiles}
              selectedImages={selectedImages}
              onFileUpload={handleFileUpload}
              onRemoveFile={removeFile}
              onRemoveImage={removeImage}
              imagePreviews={imagePreviews}
            />
          </div>
        </div>
      </div>
    </div>
  );
}