import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter, RotateCcw } from "lucide-react";
import { useScanningFilters, useAppActions } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AdvancedSearchInterface } from "@/components/AdvancedSearchInterface";

const FORCE_TYPES = [
    { value: "M", label: "Megatrend" },
    { value: "T", label: "Trend" },
    { value: "WS", label: "Weak Signal" },
    { value: "WC", label: "Wildcard" },
];

interface AnalyticsSidebarProps {
    className?: string;
    availableDimensions?: string[];
    projectId: string;
}

export function AnalyticsSidebar({ className, availableDimensions = [], projectId }: AnalyticsSidebarProps) {
    const filters = useScanningFilters();
    const { setScanningFilters } = useAppActions();

    const handleTypeChange = (type: string) => {
        const current = filters?.types || [];
        const next = current.includes(type)
            ? current.filter((t) => t !== type)
            : [...current, type];
        console.log('[AnalyticsSidebar] Type filter changed:', { current, next });
        setScanningFilters({ ...filters, types: next, showMode: 'searched' });
    };

    const handleDimensionChange = (value: string[]) => {
        console.log('[AnalyticsSidebar] Dimension filter changed:', value);
        setScanningFilters({ ...filters, dimensions: value, showMode: 'searched' });
    };

    const handleImpactChange = (value: number[]) => {
        setScanningFilters({ ...filters, impactRange: [value[0], value[1]], showMode: 'searched' });
    };

    const clearFilters = () => {
        setScanningFilters({
            ...filters,
            search: '',
            showMode: 'all',
            types: [],
            dimensions: [],
            impactRange: [1, 10],
        });
    };

    return (
        <div className={cn("flex flex-col h-full bg-card border-r", className)}>
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <h3 className="font-semibold">Filters</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Reset Filters">
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Advanced Search - First */}
                    <div className="space-y-3">
                        <AdvancedSearchInterface
                            projectId={projectId}
                            compact={true}
                            showResultsCount={false}
                            hideFilters={true}
                            emphasizeSearch={true}
                        />
                    </div>

                    <Separator />

                    {/* Show Forces - Second */}
                    <div className="space-y-3">
                        <Label>Show Forces</Label>
                        <ToggleGroup
                            type="single"
                            value={filters?.showMode || 'all'}
                            onValueChange={(value) => {
                                if (value) {
                                    console.log('[AnalyticsSidebar] Show mode changed:', value);
                                    setScanningFilters({ ...filters, showMode: value as 'all' | 'searched' | 'selected' });
                                }
                            }}
                            className="flex flex-col gap-2"
                        >
                            <ToggleGroupItem value="all" className="w-full justify-start">
                                All Forces
                            </ToggleGroupItem>
                            <ToggleGroupItem value="searched" className="w-full justify-start">
                                Searched Forces
                            </ToggleGroupItem>
                            <ToggleGroupItem value="selected" className="w-full justify-start">
                                Selected Forces
                            </ToggleGroupItem>
                        </ToggleGroup>
                        <p className="text-xs text-muted-foreground">
                            {filters?.showMode === 'searched' && 'Showing forces matching current filters'}
                            {filters?.showMode === 'selected' && 'Showing forces selected for Copilot analysis'}
                            {(!filters?.showMode || filters?.showMode === 'all') && 'Showing all forces in the project'}
                        </p>
                    </div>

                    <Separator />

                    {/* Type of Driving Forces */}
                    <div className="space-y-3">
                        <Label>Type of Driving Forces</Label>
                        <div className="flex flex-wrap gap-2">
                            {FORCE_TYPES.map((type) => {
                                const isSelected = filters?.types?.includes(type.value);
                                return (
                                    <Badge
                                        key={type.value}
                                        variant={isSelected ? "default" : "outline"}
                                        className="cursor-pointer hover:bg-primary/90"
                                        onClick={() => handleTypeChange(type.value)}
                                    >
                                        {type.label}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>

                    <Separator />

                    {/* Dimensions */}
                    <div className="space-y-3">
                        <Label>Dimensions</Label>
                        <div className="flex flex-wrap gap-2">
                            {availableDimensions.length > 0 ? (
                                availableDimensions.map((dim) => {
                                    const isSelected = filters?.dimensions?.includes(dim);
                                    return (
                                        <Badge
                                            key={dim}
                                            variant={isSelected ? "default" : "outline"}
                                            className="cursor-pointer hover:bg-primary/90"
                                            onClick={() => {
                                                const current = filters?.dimensions || [];
                                                const next = current.includes(dim)
                                                    ? current.filter((d) => d !== dim)
                                                    : [...current, dim];
                                                handleDimensionChange(next);
                                            }}
                                        >
                                            {dim}
                                        </Badge>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-muted-foreground">No dimensions available</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Impact Level */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Impact Level</Label>
                            <span className="text-sm text-muted-foreground">
                                {filters?.impactRange?.[0] || 1} - {filters?.impactRange?.[1] || 10}
                            </span>
                        </div>
                        <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={filters?.impactRange || [1, 10]}
                            onValueChange={handleImpactChange}
                            className="w-full"
                        />
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
