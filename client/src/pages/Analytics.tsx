import { useCallback, useMemo, useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { CanvasRadarChart, type RadarDataPoint } from "@/components/charts/CanvasRadarChart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentProject, useScanningFilters, useAppStore, useAppActions, useHasHydrated, useSelectedForces } from "@/lib/store";
import { scanningEvents } from "@/lib/scanningEvents";
import { Target, X, FolderOpen, Upload, FileText } from "lucide-react";
import type { Project, DrivingForce } from "@shared/schema";
import type { AdvancedSearchFilters } from "@/components/AdvancedSearchInterface";
import { TYPE_ORDER, normalizeType, type DrivingForceType } from "@/features/analytics/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { Link } from "wouter";
import { AnalyticsSidebar } from "@/features/analytics/components/AnalyticsSidebar";
import { ForceDetailPanel } from "@/features/analytics/components/ForceDetailPanel";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Analytics() {
  // Use the same project as the current scanning session to ensure force IDs match
  const selectedProjectId = useCurrentProject();

  // Get global scanning filters and selection state from store - these are our single source of truth
  const scanningFilters = useScanningFilters();
  const hasHydrated = useHasHydrated();
  const selectedForces = useSelectedForces();
  const { setScanningFilters, clearSelection } = useAppActions();

  // Fetch projects for fallback logic
  const { data: projectsList = [] } = useQuery<Project[]>({
    queryKey: ["/api/v1/projects"],
  });

  // Fallback logic: find default project if no project selected
  const currentProjectId = useMemo(() => {
    if (selectedProjectId) return selectedProjectId;

    // Ensure projects is an array and has data
    const projectsArray = Array.isArray(projectsList) ? projectsList : [];
    if (projectsArray.length === 0) return null;

    // Priority 1: Use the default project
    const defaultProject = projectsArray.find((p: any) => p.isDefault);
    if (defaultProject) return defaultProject.id;

    // Priority 2: Use project with ORION in the name
    const orionProject = projectsArray.find((p: any) =>
      p.name && p.name.toLowerCase().includes('orion')
    );
    if (orionProject) return orionProject.id;

    // Priority 3: Use first available project
    const firstProject = projectsArray[0];
    if (firstProject) return firstProject.id;

    return null;
  }, [selectedProjectId, projectsList]);

  // Track previous filters to prevent redundant emissions
  const previousFiltersRef = useRef<string | null>(null);

  // Emit filter commit event only when filters actually change (deep equality)
  useEffect(() => {
    if (!hasHydrated || !scanningFilters || !currentProjectId) return;

    const currentFiltersJson = JSON.stringify(scanningFilters);

    // Only emit if filters have actually changed (deep equality check)
    if (currentFiltersJson !== previousFiltersRef.current) {
      previousFiltersRef.current = currentFiltersJson;
      scanningEvents.emit('filtersCommitted', scanningFilters);
    }
  }, [hasHydrated, currentProjectId, scanningFilters]);

  // Fetch forces data to calculate counts for Type menu
  const { data: forces = [] } = useQuery<DrivingForce[]>({
    queryKey: ['/api/v1/scanning/forces', currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const response = await apiRequest('GET', `/api/v1/scanning/forces?project_id=${currentProjectId}`);
      const data = await response.json();
      return data.forces || [];
    },
    enabled: !!currentProjectId,
  });

  // Calculate counts for each type and extract unique dimensions
  const { typeCounts, availableDimensions } = useMemo(() => {
    const counts: Record<DrivingForceType, number> = {
      'Megatrend': 0,
      'Trend': 0,
      'Weak Signal': 0,
      'Wildcard': 0,
    };

    const dimensions = new Set<string>();

    console.log('[Analytics] Processing forces for dimensions:', { forcesCount: forces.length });

    forces.forEach(force => {
      const normalizedType = normalizeType(force.type);
      if (normalizedType && counts[normalizedType] !== undefined) {
        counts[normalizedType]++;
      }

      // Extract dimension (not STEEP, but actual topic dimensions like "Business", "Digital & AI", etc.)
      // Normalize dimension by:
      // 1. Trimming whitespace
      // 2. Replacing multiple spaces with single space
      // 3. Normalizing slashes (remove spaces around /)
      if (force.dimension) {
        const normalizedDimension = force.dimension
          .trim()
          .replace(/\s+/g, ' ')  // Multiple spaces to single space
          .replace(/\s*\/\s*/g, '/');  // Remove spaces around slashes
        dimensions.add(normalizedDimension);
      }
    });

    console.log('[Analytics] Extracted dimensions:', Array.from(dimensions));

    // Fallback to common dimensions if none found
    const fallbackDimensions = [
      'Business', 'Biotechnology', 'Digital & AI', 'Energy', 'Environment',
      'Geopolitics', 'Health', 'Society', 'Technology', 'Urban'
    ];

    const finalDimensions = dimensions.size > 0
      ? Array.from(dimensions).sort()
      : fallbackDimensions;

    return {
      typeCounts: counts,
      availableDimensions: finalDimensions
    };
  }, [forces]);

  // Map type codes to friendly names and vice versa
  const typeCodeMap: Record<DrivingForceType, string> = {
    'Megatrend': 'M',
    'Trend': 'T',
    'Weak Signal': 'WS',
    'Wildcard': 'WC',
  };

  const codeToTypeMap: Record<string, DrivingForceType> = {
    'M': 'Megatrend',
    'T': 'Trend',
    'WS': 'Weak Signal',
    'WC': 'Wildcard',
  };

  // Derive selected types from scanning filters store (bidirectional sync)
  const selectedTypes = useMemo(() => {
    const types = scanningFilters?.types;
    // If types is undefined, initialize to all types; if empty array, respect it
    if (types === undefined) {
      return new Set(TYPE_ORDER);
    }
    const friendlyTypes = types.map(code => codeToTypeMap[code]).filter(Boolean) as DrivingForceType[];
    return new Set(friendlyTypes);
  }, [scanningFilters?.types]);

  // Type filter handlers - update global scanning filters
  const toggleType = useCallback((type: DrivingForceType) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    const newCodes = Array.from(newSet).map(t => typeCodeMap[t]);
    setScanningFilters({
      ...(scanningFilters || {}),
      types: newCodes,
    });
  }, [selectedTypes, scanningFilters, setScanningFilters]);

  const selectAllTypes = useCallback(() => {
    const allCodes = TYPE_ORDER.map(t => typeCodeMap[t]);
    setScanningFilters({
      ...(scanningFilters || {}),
      types: allCodes,
    });
  }, [scanningFilters, setScanningFilters]);

  const clearAllTypes = useCallback(() => {
    setScanningFilters({
      ...(scanningFilters || {}),
      types: [],
    });
  }, [scanningFilters, setScanningFilters]);

  // Handle filter changes from AdvancedSearchInterface
  const handleFiltersChange = useCallback((filters: AdvancedSearchFilters) => {
    setScanningFilters({
      search: filters.search || undefined,
      types: filters.types,
      steep: filters.steep || [],
      sentiments: filters.sentiments || [],
      tags: filters.tags || [],
      impactRange: [filters.impactMin, filters.impactMax],
      sort: filters.sort,
      // Legacy fields for backward compatibility
      lens: "all",
      timeHorizon: "all",
      sentimentFilter: "all",
    });
  }, [setScanningFilters]);

  // Get project data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/v1/projects"],
  });

  const currentProject = projects.find((p) => p.id === currentProjectId);

  // State for the detail panel
  // State for the detail panel
  const [focusedForce, setFocusedForce] = useState<Partial<DrivingForce> | null>(null);

  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch("/api/v1/scanning/import", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: data,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import file");
      }

      return response.json();
    },
    onSuccess: (importResult) => {
      setIsImportDialogOpen(false);

      // Auto-select imported forces
      if (importResult.forces && importResult.forces.length > 0) {
        // We don't auto-select in Radar view to avoid clutter, but we notify
        toast({
          title: "Data imported successfully",
          description: `Imported ${importResult.count} driving forces.`,
        });
      } else {
        toast({
          title: "Data imported successfully",
          description: "Your driving forces have been imported and are ready for processing.",
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/v1/scanning/forces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/analytics/radar"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import data. Please check your file format and try again.",
        variant: "destructive",
      });
    },
  });

  const handleImport = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const processFile = useCallback((file: File) => {
    if (!currentProjectId) {
      toast({
        title: "No project selected",
        description: "Please select a project before importing data.",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'];
    const allowedExtensions = ['.csv', '.xls', '.xlsx', '.json'];

    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidType && !hasValidExtension) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV, Excel, or JSON file.",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', currentProjectId);

    importMutation.mutate(formData);
  }, [currentProjectId, toast, importMutation]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
    event.target.value = '';
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleNodeClick = useCallback((point: RadarDataPoint) => {
    setFocusedForce({
      id: point.id,
      title: point.driving_force,
      text: point.description,
      type: point.type as DrivingForceType,
      dimension: point.dimension,
      impact: point.level_of_impact || undefined,
      ttm: point.time_to_market || undefined,
      urgency: point.urgency,
      feasibility: point.feasibility,
      sentiment: point.sentiment,
      source: point.source,
      // Add other mapped fields as needed
    });
  }, []); // Also select it in the global store for visual feedback
  // The following block was part of the previous implementation and is commented out
  // as it refers to 'forceId' which is no longer directly passed to handleNodeClick.
  // If this logic is still needed, it should be adapted to use 'point.id'.
  // if (!selectedForces.has(forceId)) {
  //   // If holding shift/ctrl, we might want to add. For now, let's just add it.
  //   // But for the panel, we usually want to focus one.
  //   // Let's just set focus for the panel.
  // }


  // Show empty state if no project selected
  if (!currentProjectId) {
    return (
      <div className="flex flex-col h-full">
        <Header
          title="Radar"
          subtitle="Strategic intelligence visualization and insights"
        />
        <div className="flex-1 p-6">
          <EmptyState
            icon={FolderOpen}
            title="No Project Selected"
            description="Please select a project to view analytics and visualizations."
            action={
              <Link href="/projects">
                <Button>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Go to Projects
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <Header
        title="Radar"
        subtitle={currentProject?.name || "Strategic intelligence visualization and insights"}
        onImport={handleImport}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Filters */}
        <AnalyticsSidebar
          className="w-80 shrink-0"
          availableDimensions={availableDimensions}
          projectId={currentProjectId}
        />

        {/* Main Content - Radar */}
        <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
          <div className="flex-1 p-4 overflow-y-auto">

            {/* Force Selection Summary */}
            {selectedForces.size > 0 && (
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900 mb-4">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                      <Target className="h-3 w-3 mr-1" />
                      <span>{selectedForces.size} selected</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Click forces in the chart to select • Click again to deselect
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>
              </Card>
            )}

            {/* Main Chart */}
            <div className="flex-1 min-h-[600px] h-[calc(100vh-14rem)] p-4 relative overflow-hidden bg-card rounded-lg border shadow-sm">
              <div className="absolute inset-0 p-4">
                <CanvasRadarChart
                  projectId={currentProjectId}
                  className="h-full w-full"
                  onNodeClick={handleNodeClick}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Detail Panel */}
        <ForceDetailPanel
          forceId={focusedForce?.id || null}
          initialData={focusedForce}
          onClose={() => setFocusedForce(null)}
        />
      </div>
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Driving Forces</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Template buttons at top */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => window.open('/api/v1/scanning/template/csv', '_blank')}
                data-testid="button-download-csv-template"
              >
                <FileText className="w-3 h-3 mr-1" />
                CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => window.open('/api/v1/scanning/template/xlsx', '_blank')}
                data-testid="button-download-xlsx-template"
              >
                <FileText className="w-3 h-3 mr-1" />
                Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => window.open('/api/v1/scanning/template/json', '_blank')}
                data-testid="button-download-json-template"
              >
                <FileText className="w-3 h-3 mr-1" />
                JSON
              </Button>
            </div>

            {/* Improved drop zone */}
            <div
              className={`
                border-2 border-dashed rounded-2xl p-12 text-center
                transition-all duration-300
                ${isDragging
                  ? 'border-primary bg-primary/10 scale-[1.02]'
                  : 'border-border hover:border-primary/50'
                }
              `}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              data-testid="drop-zone"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Upload className={`w-10 h-10 transition-all ${isDragging ? 'text-primary animate-bounce' : 'text-primary/60'
                  }`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Drop files here</h3>
              <p className="text-sm text-muted-foreground mb-6">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Supports CSV, XLSX, JSON up to 10MB
              </p>


              <input
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                data-testid="input-file-upload"
                ref={(input) => {
                  if (input) {
                    (window as any).fileInput = input;
                  }
                }}
              />
              <Button
                type="button"
                size="lg"
                className="rounded-full px-8"
                disabled={importMutation.isPending}
                data-testid="button-choose-files"
                onClick={() => {
                  const input = document.getElementById('file-upload') as HTMLInputElement;
                  if (input) {
                    input.click();
                  }
                }}
              >
                {importMutation.isPending ? "Importing..." : "Choose Files"}
              </Button>
            </div>

            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(false)}
                data-testid="button-cancel-import"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
