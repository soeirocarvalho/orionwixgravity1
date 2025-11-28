import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ExternalLink, Calendar, Tag, Activity, CheckCircle2, Circle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DrivingForce } from "@shared/schema";
import { useState, useEffect, useMemo } from "react";
import { useAppStore, useAppActions, useSelectedForces } from "@/lib/store";

interface ForceDetailPanelProps {
    forceId: string | null;
    initialData?: Partial<DrivingForce> | null;
    onClose: () => void;
}

const TYPE_MAPPING: Record<string, string> = {
    'M': 'Megatrend',
    'T': 'Trend',
    'WS': 'Weak Signal',
    'WC': 'Wildcard',
    'S': 'Signal'
};

const truncateText = (text: string | undefined, wordCount: number) => {
    if (!text) return "";
    const words = text.split(/\s+/);
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(" ") + "...";
};

export function ForceDetailPanel({ forceId, initialData, onClose }: ForceDetailPanelProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [localForce, setLocalForce] = useState<Partial<DrivingForce> | null>(initialData || null);

    // Selection state
    const selectedForcesSet = useSelectedForces();
    const { selectForces } = useAppActions();
    const isSelected = useMemo(() => forceId ? selectedForcesSet.has(forceId) : false, [selectedForcesSet, forceId]);

    const handleToggleSelection = () => {
        if (!forceId) return;
        const mode = isSelected ? 'remove' : 'add';
        selectForces([forceId], mode);
        toast({
            title: isSelected ? "Removed from selection" : "Added to selection",
            description: isSelected
                ? "Force removed from your Copilot analysis context"
                : "Force added to your Copilot analysis context. Use the Copilot to analyze selected forces."
        });
    };

    // Update local state when initialData changes (e.g. clicking a different node)
    useEffect(() => {
        if (initialData) {
            setLocalForce(initialData);
        }
    }, [initialData]);

    // Fetch force details
    const { data: force, isLoading } = useQuery<DrivingForce>({
        queryKey: [`/api/v1/scanning/forces/${forceId}`],
        enabled: !!forceId,
    });

    // Update local state when force data arrives
    useEffect(() => {
        if (force) {
            setLocalForce(force);
        }
    }, [force]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (updates: Partial<DrivingForce>) => {
            if (!forceId) return;
            const res = await apiRequest("PATCH", `/api/v1/scanning/forces/${forceId}`, updates);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/v1/scanning/forces/${forceId}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/v1/scanning/forces"] });
            // Note: We don't invalidate the radar query here because force detail updates
            // don't affect radar positioning (magnitude, distance, color remain the same)
            toast({ title: "Updated", description: "Driving force updated successfully" });
        },
        onError: (error) => {
            toast({ title: "Error", description: "Failed to update force", variant: "destructive" });
        },
    });

    const handleUpdate = (updates: Partial<DrivingForce>) => {
        if (!localForce) return;
        setLocalForce({ ...localForce, ...updates });
        updateMutation.mutate(updates);
    };

    if (!forceId) return null;

    return (
        <Sheet modal={false} open={!!forceId} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col shadow-2xl border-l">
                <SheetHeader className="p-6 border-b">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            {isLoading || !localForce ? (
                                <>
                                    <div className="h-5 w-20 bg-muted animate-pulse rounded mb-2" />
                                    <SheetTitle className="text-xl">Loading details...</SheetTitle>
                                    <SheetDescription>Please wait while we fetch the force data.</SheetDescription>
                                </>
                            ) : (
                                <>
                                    <Badge variant="outline" className="mb-2">
                                        {localForce.type ? (TYPE_MAPPING[localForce.type] || localForce.type) : ''}
                                    </Badge>
                                    <SheetTitle className="text-xl">{localForce.title}</SheetTitle>
                                    <SheetDescription className="line-clamp-none">
                                        {truncateText(localForce.text, 80)}
                                    </SheetDescription>
                                </>
                            )}
                        </div>
                    </div>
                </SheetHeader>

                {isLoading || !localForce ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">
                                {/* Dimensions & Classification */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Activity className="h-4 w-4" /> Classification
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Dimension</Label>
                                            <Select
                                                value={localForce.dimension}
                                                onValueChange={(val) => handleUpdate({ dimension: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {["Business", "Identities", "Digital & AI", "Consumer", "Biotechnology", "Social", "Technological", "Economic", "Environmental", "Political"].map((d) => (
                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Time Horizon</Label>
                                            <Select
                                                value={localForce.ttm || "2-5 years"}
                                                onValueChange={(val) => handleUpdate({ ttm: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {["0-1 year", "1-2 years", "2-5 years", "5-10 years", "10+ years"].map((t) => (
                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Impact Scores */}
                                <div className="space-y-6">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Activity className="h-4 w-4" /> Assessment
                                    </h4>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Impact ({localForce.impact})</Label>
                                        </div>
                                        <Slider
                                            min={1}
                                            max={10}
                                            step={1}
                                            value={[localForce.impact || 5]}
                                            onValueChange={(val) => handleUpdate({ impact: val[0] })}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Feasibility ({localForce.feasibility})</Label>
                                        </div>
                                        <Slider
                                            min={1}
                                            max={10}
                                            step={1}
                                            value={[localForce.feasibility || 5]}
                                            onValueChange={(val) => handleUpdate({ feasibility: val[0] })}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Urgency ({localForce.urgency})</Label>
                                        </div>
                                        <Slider
                                            min={1}
                                            max={10}
                                            step={1}
                                            value={[localForce.urgency || 5]}
                                            onValueChange={(val) => handleUpdate({ urgency: val[0] })}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Tags */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Tag className="h-4 w-4" /> Tags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {localForce.tags?.map((tag, i) => (
                                            <Badge key={i} variant="secondary">{tag}</Badge>
                                        ))}
                                        <Button variant="outline" size="sm" className="h-6 text-xs">
                                            + Add Tag
                                        </Button>
                                    </div>
                                </div>


                                <Separator />

                                {/* Sources */}
                                {localForce.source && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <ExternalLink className="h-4 w-4" /> Source
                                        </h4>
                                        <div className="text-sm">
                                            {localForce.source.startsWith('http') ? (
                                                <a
                                                    href={localForce.source}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline break-all"
                                                >
                                                    {localForce.source}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground">{localForce.source}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <div className="p-6 border-t bg-muted/10">
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    variant={isSelected ? "default" : "outline"}
                                    onClick={handleToggleSelection}
                                    title={isSelected
                                        ? "Remove from Copilot analysis selection"
                                        : "Add to Copilot for deeper analysis"}
                                >
                                    {isSelected ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Selected
                                        </>
                                    ) : (
                                        <>
                                            <Circle className="w-4 h-4 mr-2" />
                                            Select
                                        </>
                                    )}
                                </Button>
                                <Button variant="outline" onClick={onClose}>
                                    Close
                                </Button>
                            </div>
                        </div>                    </>
                )}
            </SheetContent>
        </Sheet >
    );
}
