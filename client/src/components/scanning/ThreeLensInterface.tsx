import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Search, Filter, Download, AlertCircle, Zap, ChevronLeft, ChevronRight, Plus, Trash2, Layers, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AdvancedSearchInterface, DIMENSIONS, FORCE_TYPES } from "@/components/AdvancedSearchInterface";
import { VirtualizedSearchResults } from "@/components/VirtualizedSearchResults";
import { SavedSearches } from "@/components/SavedSearches";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore, useAppActions, useScanningFilters, useSelectedForces } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { DrivingForce, SearchResponse } from "@shared/schema";

// Network data structure for analytics
interface ForceNetworkData {
  nodes: Array<any>;
  edges: Array<any>;
  clusters: Array<{
    id: string;
    label: string;
    centerX: number;
    centerY: number;
    centerZ: number;
    color: string;
    size: number;
    quality?: number;
    forceCount: number;
  }>;
  layoutBounds: {
    xRange: [number, number];
    yRange: [number, number];
    zRange: [number, number];
  };
  metrics: {
    totalForces: number;
    totalClusters: number;
    assignedForces: number;
    unassignedForces: number;
    averageClusterSize: number;
    averageQuality: number;
    algorithm: string;
    isolatedClusters: number;
  };
}

interface ThreeLensInterfaceProps {
  projectId: string;
}

// Enhanced form schema with force selection validation
const projectFormSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .min(3, "Project name must be at least 3 characters")
    .max(100, "Project name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Project name can only contain letters, numbers, spaces, hyphens, and underscores"),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function ThreeLensInterface({ projectId }: ThreeLensInterfaceProps) {
  const [activeCategory, setActiveCategory] = useState("curated");

  // Get global filters to initialize local state
  const globalFilters = useScanningFilters();

  const [filters, setFilters] = useState({
    steep: globalFilters?.steep?.[0] || "all",
    timeHorizon: globalFilters?.timeHorizon || "all",
    search: globalFilters?.search || "",
    sort: globalFilters?.sort || "newest", // newest, oldest, selected
    dimensions: globalFilters?.dimensions || [],
    types: globalFilters?.types || [], // Force types: M, T, WS, WC
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);

  // Debounce search input for API calls (300ms delay like Advanced Search)
  const debouncedSearch = useDebounce(filters.search, 300);

  // Selection state
  // Selection state
  const selectedForcesSet = useSelectedForces();
  const selectedForcesArray = useMemo(() => Array.from(selectedForcesSet), [selectedForcesSet]);
  const selectedForces = selectedForcesSet; // Alias for compatibility
  const { toggleForceSelection, selectForces, clearSelection, setCurrentProject, setScanningFilters, setSearchedForces } = useAppActions();

  // Clear selection only when project actually changes (not on initial mount)
  const prevProjectIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevProjectIdRef.current !== null && prevProjectIdRef.current !== projectId) {
      console.log('[ThreeLensInterface] Project changed, clearing selection:', { from: prevProjectIdRef.current, to: projectId });
      clearSelection();
    }
    prevProjectIdRef.current = projectId;
  }, [projectId, clearSelection]);

  // Sync local filters to global scanningFilters store for radar integration
  // Use debounced search to avoid rapid updates
  useEffect(() => {
    setScanningFilters({
      search: debouncedSearch,
      types: filters.types,
      dimensions: filters.dimensions,
      steep: filters.steep !== 'all' ? [filters.steep] : [],
      timeHorizon: filters.timeHorizon,
      sort: filters.sort,
    });
  }, [debouncedSearch, filters.types, filters.dimensions, filters.steep, filters.timeHorizon, filters.sort, setScanningFilters]);

  // Pagination state for curated and signals
  const [pagination, setPagination] = useState({
    curated: { page: 0, itemsPerPage: 50 },
    signals: { page: 0, itemsPerPage: 20 },
  });

  // Dialog and form state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Form handling with enhanced validation
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  // Enhanced validation for force selection
  const validateForceSelection = () => {
    if (selectedForces.size === 0) {
      toast({
        title: "No Forces Selected",
        description: "Please select at least one driving force before creating a project.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Enhanced save handler with validation
  const handleSaveAsProject = () => {
    if (!validateForceSelection()) {
      return;
    }
    setSaveDialogOpen(true);
  };

  // Enhanced mutation with better error handling
  const duplicateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      // Final validation before API call
      if (selectedForces.size === 0) {
        throw new Error("No forces selected for project creation");
      }

      const response = await apiRequest(
        "POST",
        `/api/v1/projects/${projectId}/duplicate`,
        {
          name: data.name.trim(),
          selectedForceIds: Array.from(selectedForces),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Create error with both status and message for better handling
        const error = new Error(errorData.message || errorData.error || 'Failed to create project');
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }

      return response.json();
    },
    onSuccess: (newProject: any) => {
      toast({
        title: "Project Created Successfully",
        description: `"${newProject.name}" has been created with ${selectedForces.size} selected forces. Switching to new project...`,
      });
      setSaveDialogOpen(false);
      form.reset();
      clearSelection();

      // Enhanced project switching with feedback
      setTimeout(() => {
        setCurrentProject(newProject.id);
        setLocation("/scanning");

        // Additional success feedback after switch
        setTimeout(() => {
          toast({
            title: "Project Switch Complete",
            description: `Now viewing project: "${newProject.name}". You can start analyzing your selected forces.`,
          });
        }, 500);
      }, 300);
    },
    onError: (error: any) => {
      console.error("Failed to create project:", error);

      // Enhanced error handling with deterministic status code detection
      let title = "Failed to Create Project";
      let description = "An error occurred while creating the project. Please try again.";

      // Handle 409 Conflict (duplicate name) deterministically
      if (error.status === 409) {
        title = "Project Name Already Exists";
        description = `A project with the name "${form.getValues('name')}" already exists. Please choose a different name.`;

        // Set focus back to name field
        setTimeout(() => {
          const nameField = document.querySelector('[data-testid="input-project-name"]') as HTMLInputElement;
          if (nameField) nameField.focus();
        }, 100);
      } else if (error.message) {
        // Handle other specific error types by message (as fallback)
        if (error.message.includes("forces not found")) {
          title = "Invalid Force Selection";
          description = "Some selected forces are no longer available. Please refresh and try again.";
        } else if (error.message.includes("default project")) {
          title = "Cannot Duplicate Default Project";
          description = "Full duplication from the default project is not allowed. Please select specific forces to duplicate.";
        } else {
          description = error.message;
        }
      }

      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  // Create API URL for advanced search (when search term is present)
  const createSearchApiUrl = (page: number = 0, limit: number = 50) => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);

    // Advanced search uses 'q' parameter with debounced search value
    params.append('q', debouncedSearch || '*');
    params.append('page', (page + 1).toString()); // Search API uses 1-based pagination
    params.append('pageSize', limit.toString());
    params.append('sort', 'relevance');
    params.append('sortOrder', 'desc');
    params.append('includeFacets', 'false');
    params.append('includeEmbeddings', 'false');

    // Add force type filters (curated types only: M, T, WS, WC)
    const typesToSearch = filters.types && filters.types.length > 0
      ? filters.types
      : ['M', 'T', 'WS', 'WC']; // Default to all curated types
    typesToSearch.forEach(type => params.append('types', type));

    // Add dimension filters
    if (filters.dimensions && filters.dimensions.length > 0) {
      filters.dimensions.forEach(dim => params.append('dimensions', dim));
    }

    // Add STEEP filter
    if (filters.steep !== 'all') {
      params.append('steep', filters.steep);
    }

    return `/api/v1/forces/search?${params.toString()}`;
  };

  // Create API URL for curated forces (all types together) - used when no search term
  const createCuratedApiUrl = (page: number = 0, limit: number = 50) => {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId);
    if (filters.steep !== 'all') params.append('steep', filters.steep);

    // Add dimension filters
    if (filters.dimensions && filters.dimensions.length > 0) {
      filters.dimensions.forEach(dim => params.append('dimensions', dim));
    }

    // Add force type filters as comma-separated string (backend expects this format)
    if (filters.types && filters.types.length > 0) {
      params.append('type', filters.types.join(','));
    }

    params.append('includeSignals', 'false'); // Exclude signals for curated forces
    params.append('limit', limit.toString());
    params.append('offset', (page * limit).toString());

    return `/api/v1/scanning/forces?${params.toString()}`;
  };

  const createSignalsApiUrl = (page: number = 0, limit: number = 20) => {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId);
    if (filters.steep !== 'all') params.append('steep', filters.steep);
    if (filters.search) params.append('search', filters.search);
    params.append('includeSignals', 'true'); // Include signals
    params.append('limit', limit.toString());
    params.append('offset', (page * limit).toString());
    // Add filter to only get signals (type 'S')
    params.append('type', 'S');
    return `/api/v1/scanning/forces?${params.toString()}`;
  };

  // Single unified query for all curated forces with pagination
  // Uses advanced search endpoint when debounced search term is present
  const curatedForcesQuery = useQuery<{
    forces: DrivingForce[];
    total: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
  }>({
    queryKey: [
      debouncedSearch ? "/api/v1/forces/search" : "/api/v1/scanning/forces",
      projectId,
      "curated",
      debouncedSearch,
      filters.types,
      filters.dimensions,
      filters.steep,
      pagination.curated.page
    ],
    queryFn: async () => {
      // Use advanced search endpoint when debounced search term is present
      const useSearch = debouncedSearch && debouncedSearch.trim().length > 0;
      const url = useSearch
        ? createSearchApiUrl(pagination.curated.page, pagination.curated.itemsPerPage)
        : createCuratedApiUrl(pagination.curated.page, pagination.curated.itemsPerPage);

      const response = await apiRequest("GET", url);
      const data = await response.json();

      // Handle SearchResponse format (from /api/v1/forces/search)
      // Search endpoint returns data.forces, not data.results
      if (useSearch && data.forces && Array.isArray(data.forces)) {
        return {
          forces: data.forces,
          total: data.total,
          hasMore: data.hasMore,
        };
      }

      // Handle regular format (from /api/v1/scanning/forces)
      return data;
    },
    enabled: !!projectId && activeCategory === "curated",
    staleTime: 1000 * 60 * 5,
  });

  // Query for non-curated signals
  const signalsQuery = useQuery<{
    forces: DrivingForce[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }>({
    queryKey: ["/api/v1/scanning/forces", projectId, "signals", filters, pagination.signals.page],
    queryFn: async () => {
      const response = await apiRequest("GET", createSignalsApiUrl(pagination.signals.page, pagination.signals.itemsPerPage));
      return response.json();
    },
    enabled: !!projectId && activeCategory === "signals",
    staleTime: 1000 * 60 * 5,
  });

  // Capture searched force IDs when curated forces data changes
  useEffect(() => {
    const forces = curatedForcesQuery.data?.forces || [];
    if (forces.length > 0) {
      // Capture force IDs as "searched forces" whether there's a search or not
      // This allows "Searched Forces" filter to work even without an explicit search
      const forceIds = forces.map(f => f.id).filter((id): id is string => Boolean(id));
      setSearchedForces(forceIds);
      console.log('[ThreeLensInterface] Captured searched forces:', {
        count: forceIds.length,
        hasSearch: debouncedSearch.trim().length > 0,
        search: debouncedSearch || '(all curated forces)'
      });
    }
  }, [curatedForcesQuery.data?.forces, debouncedSearch, setSearchedForces]);

  // Add query for network data to get accurate cluster count (like Dashboard)
  const { data: networkData } = useQuery<ForceNetworkData | null>({
    queryKey: [`/api/v1/analytics/force-network/${projectId}`],
    enabled: !!projectId,
  });

  // Calculate curated forces and signals totals
  const curatedTotal = Number(curatedForcesQuery.data?.total || 0);
  const signalsTotal = Number(signalsQuery.data?.total || 0);

  const getLensLabel = (lens: string) => {
    switch (lens) {
      case "megatrends": return "Megatrends";
      case "trends": return "Trends";
      case "weak_signals": return "Weak Signals";
      case "wildcards": return "Wildcards";
      default: return lens;
    }
  };

  const getSteepColor = (steep: string) => {
    const colors: { [key: string]: string } = {
      "Social": "bg-chart-1/20 text-chart-1",
      "Technological": "bg-chart-2/20 text-chart-2",
      "Economic": "bg-chart-3/20 text-chart-3",
      "Environmental": "bg-chart-4/20 text-chart-4",
      "Political": "bg-chart-5/20 text-chart-5",
    };
    return colors[steep] || "bg-muted text-muted-foreground";
  };

  const getSentimentColor = (sentiment: string) => {
    const colors: { [key: string]: string } = {
      "Positive": "bg-chart-2/20 text-chart-2",
      "Negative": "bg-destructive/20 text-destructive",
      "Neutral": "bg-muted text-muted-foreground",
    };
    return colors[sentiment] || "bg-muted text-muted-foreground";
  };

  // Helper function to convert type codes to full names
  const getTypeDisplayName = (type: string | undefined) => {
    if (!type) return "Unknown";
    switch (type) {
      case "M":
        return "Megatrend";
      case "T":
        return "Trend";
      case "WS":
        return "Weak Signal";
      case "WC":
        return "Wildcard";
      case "S":
        return "Signal";
      default:
        return type || "Unknown";
    }
  };

  const getTypeColor = (type: string | undefined) => {
    if (!type) return "bg-muted text-muted-foreground";
    const colors: { [key: string]: string } = {
      "M": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "T": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "WS": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "WC": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      "S": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  // Sort forces based on filter
  const sortForces = (forces: DrivingForce[]) => {
    const forcesCopy = [...forces];

    switch (filters.sort) {
      case "selected":
        // Selected forces first, then unselected
        return forcesCopy.sort((a, b) => {
          const aSelected = a.id && selectedForces.has(a.id);
          const bSelected = b.id && selectedForces.has(b.id);
          if (aSelected && !bSelected) return -1;
          if (!aSelected && bSelected) return 1;
          return 0; // Keep original order for same selection state
        });
      case "oldest":
        // Oldest first (ascending by createdAt)
        return forcesCopy.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return aTime - bTime;
        });
      case "newest":
      default:
        // Newest first (descending by createdAt) - default behavior from API
        return forcesCopy.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
    }
  };

  // Get forces for specific tab type
  const getFilteredForces = (tabType: string) => {
    if (tabType === "curated") {
      return sortForces(curatedForcesQuery.data?.forces || []);
    } else if (tabType === "signals") {
      return sortForces(signalsQuery.data?.forces || []);
    }
    return [];
  };

  // Get pagination data for specific tab
  const getPaginationData = (tabType: string) => {
    let query, currentPage, itemsPerPage;

    if (tabType === "curated") {
      query = curatedForcesQuery;
      currentPage = pagination.curated.page;
      itemsPerPage = pagination.curated.itemsPerPage;
    } else if (tabType === "signals") {
      query = signalsQuery;
      currentPage = pagination.signals.page;
      itemsPerPage = pagination.signals.itemsPerPage;
    } else {
      query = curatedForcesQuery;
      currentPage = 0;
      itemsPerPage = 50;
    }

    const total = query.data?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    const hasNextPage = currentPage < totalPages - 1;
    const hasPrevPage = currentPage > 0;

    return {
      currentPage,
      totalPages,
      total,
      itemsPerPage,
      hasNextPage,
      hasPrevPage,
      isLoading: query.isLoading
    };
  };

  // Handle page changes
  const handlePageChange = (tabType: string, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      [tabType]: {
        ...prev[tabType as keyof typeof prev],
        page: Math.max(0, newPage)
      }
    }));
  };

  // Extract first 2 paragraphs from text for tooltip
  const getDescriptionPreview = (text: string | null | undefined): string => {
    if (!text) return "No description available";

    // Split by double newlines first (paragraph separators)
    const paragraphsByDoubleNewline = text.split(/\n\s*\n/);
    if (paragraphsByDoubleNewline.length >= 2) {
      return paragraphsByDoubleNewline.slice(0, 2).join('\n\n').trim();
    }

    // If no double newlines, split by single newlines and group
    const sentences = text.split(/\n/);
    if (sentences.length >= 2) {
      return sentences.slice(0, 2).join('\n').trim();
    }

    // If no newlines, split by sentence endings and take first 2 sentences
    const sentenceEndings = text.split(/(?<=[.!?])\s+/);
    if (sentenceEndings.length >= 2) {
      return sentenceEndings.slice(0, 2).join(' ').trim();
    }

    // If text is too short, return as is but limit to reasonable length
    return text.length > 300 ? text.substring(0, 300) + '...' : text;
  };

  // Debug logging
  useEffect(() => {
    console.log('[DEBUG] ThreeLensInterface - Component state:', {
      activeCategory,
      projectId,
      curatedTotal,
      signalsTotal,
      curatedForces: curatedForcesQuery.data?.forces?.length || 0,
      signalForces: signalsQuery.data?.forces?.length || 0,
    });
  }, [activeCategory, curatedTotal, signalsTotal]);

  // Selection handlers
  const handleSelectAll = (forces: DrivingForce[], checked: boolean) => {
    const forceIds = forces.map(f => f.id).filter((id): id is string => Boolean(id));
    if (checked) {
      selectForces(forceIds, 'add');
    } else {
      selectForces(forceIds, 'remove');
    }
  };

  const isAllSelected = (forces: DrivingForce[]) => {
    return forces.length > 0 && forces.every(force => force.id && selectedForces.has(force.id));
  };

  const isSomeSelected = (forces: DrivingForce[]) => {
    return forces.some(force => force.id && selectedForces.has(force.id));
  };

  const getSelectAllState = (forces: DrivingForce[]) => {
    const allSelected = isAllSelected(forces);
    const someSelected = isSomeSelected(forces);
    if (allSelected) return true;
    if (someSelected) return 'indeterminate' as const;
    return false;
  };

  // Filter handlers
  const toggleArrayFilter = useCallback((currentArray: string[], value: string, setter: (arr: string[]) => void) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    setter(newArray);
  }, []);

  const clearCuratedFilters = useCallback(() => {
    setFilters({
      ...filters,
      dimensions: [],
      types: [],
    });
  }, [filters]);

  // Filter UI for Curated Forces
  const renderCuratedFilters = () => {
    if (!showFilters) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCuratedFilters}
              data-testid="button-clear-curated-filters"
            >
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Force Types */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Force Types</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'M', label: 'Megatrends' },
                { value: 'T', label: 'Trends' },
                { value: 'WS', label: 'Weak Signals' },
                { value: 'WC', label: 'Wildcards' },
              ].map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={filters.types.includes(type.value)}
                    onCheckedChange={() => toggleArrayFilter(filters.types, type.value, (arr) => setFilters({ ...filters, types: arr }))}
                    data-testid={`checkbox-type-${type.value.toLowerCase()}`}
                  />
                  <Label
                    htmlFor={`type-${type.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Dimensions</Label>
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    data-testid="button-select-dimensions-curated"
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    {filters.dimensions.length > 0
                      ? `${filters.dimensions.length} dimension${filters.dimensions.length > 1 ? 's' : ''} selected`
                      : "Select dimensions..."
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <Command>
                    <CommandInput placeholder="Search dimensions..." />
                    <CommandEmpty>No dimensions found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {DIMENSIONS.map((dimension) => (
                        <CommandItem
                          key={dimension.value}
                          value={dimension.value}
                          onSelect={() => toggleArrayFilter(filters.dimensions, dimension.value, (arr) => setFilters({ ...filters, dimensions: arr }))}
                        >
                          <div className="flex items-center flex-1">
                            <div
                              className={`mr-2 h-4 w-4 border rounded flex items-center justify-center ${filters.dimensions.includes(dimension.value) ? 'bg-primary border-primary' : 'border-input'
                                }`}
                            >
                              {filters.dimensions.includes(dimension.value) && (
                                <div className="h-2 w-2 bg-primary-foreground rounded-sm" />
                              )}
                            </div>
                            <span>{dimension.label}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected dimensions as removable badges */}
              {filters.dimensions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.dimensions.map((dimensionValue) => {
                    const dimension = DIMENSIONS.find(d => d.value === dimensionValue);
                    return (
                      <Badge
                        key={dimensionValue}
                        variant="secondary"
                        className={dimension?.color || "bg-muted"}
                        data-testid={`badge-dimension-${dimensionValue.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {dimension?.label || dimensionValue}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => toggleArrayFilter(filters.dimensions, dimensionValue, (arr) => setFilters({ ...filters, dimensions: arr }))}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Reusable ForceTable component with pagination
  const ForceTable = ({ forces: tableForcesToShow, tabType, isLoading }: { forces: DrivingForce[], tabType: string, isLoading?: boolean }) => {
    const paginationData = getPaginationData(tabType);
    const selectedCount = selectedForces.size;

    return (
      <div>
        {/* Sort and Filter Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="sort-select" className="text-sm text-muted-foreground">Sort by:</Label>
            <Select
              value={filters.sort}
              onValueChange={(value) => setFilters({ ...filters, sort: value })}
            >
              <SelectTrigger className="w-[180px]" id="sort-select" data-testid="select-sort">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="selected">Selected First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground" data-testid="selection-count">
                {selectedCount} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                data-testid="button-clear-selection"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Selection Toolbar */}
        {selectedCount > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium" data-testid="selection-count-toolbar">
                  {selectedCount} force{selectedCount === 1 ? '' : 's'} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAsProject}
                  disabled={selectedForces.size === 0}
                  data-testid="button-save-as-project"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Save as New Project
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  data-testid="button-export-selected"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-12">
                  <Checkbox
                    checked={getSelectAllState(tableForcesToShow)}
                    onCheckedChange={(checked) => handleSelectAll(tableForcesToShow, checked === true)}
                    aria-label="Select all forces on this page"
                    data-testid="checkbox-select-all"
                  />
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Dimension</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Scope</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Loading forces...
                  </td>
                </tr>
              ) : tableForcesToShow.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No driving forces found. Import data to get started.
                  </td>
                </tr>
              ) : (
                tableForcesToShow.map((force: DrivingForce) => (
                  <tr key={force.id} className={`hover:bg-muted/50 ${force.id && selectedForces.has(force.id) ? 'bg-muted/30' : ''}`} data-testid={`force-row-${force.id}`}>
                    <td className="py-3 px-4">
                      <Checkbox
                        checked={force.id ? selectedForces.has(force.id) : false}
                        onCheckedChange={() => force.id && toggleForceSelection(force.id)}
                        aria-label={`Select ${force.title}`}
                        data-testid={`checkbox-force-${force.id}`}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <p className="font-medium text-sm" data-testid={`force-title-${force.id}`}>
                                {force.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {force.text ? force.text.substring(0, 100) + "..." : "No description available"}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            align="start"
                            className="max-w-md p-4 bg-popover border border-border rounded-lg shadow-lg z-50"
                          >
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm text-foreground mb-2">{force.title}</h4>
                              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {getDescriptionPreview(force.text)}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getTypeColor(force.type)} data-testid={`force-type-${force.id}`}>
                        {getTypeDisplayName(force.type)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-muted text-muted-foreground" data-testid={`force-dimension-${force.id}`}>
                        {force.dimension || 'Unassigned'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-full bg-muted rounded-full h-2 mr-2 max-w-20">
                          <div
                            className="bg-chart-1 h-2 rounded-full"
                            style={{ width: `${(force.magnitude || 0) * 10}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground" data-testid={`force-magnitude-${force.id}`}>
                          {force.magnitude || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-full bg-muted rounded-full h-2 mr-2 max-w-20">
                          <div
                            className="bg-chart-3 h-2 rounded-full"
                            style={{ width: `${(force.distance || 0) * 10}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground" data-testid={`force-distance-${force.id}`}>
                          {force.distance || "N/A"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {paginationData.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {paginationData.currentPage * paginationData.itemsPerPage + 1} to {Math.min((paginationData.currentPage + 1) * paginationData.itemsPerPage, paginationData.total)} of {paginationData.total} forces
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(tabType, paginationData.currentPage - 1)}
                disabled={!paginationData.hasPrevPage || paginationData.isLoading}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {paginationData.currentPage + 1} of {paginationData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(tabType, paginationData.currentPage + 1)}
                disabled={!paginationData.hasNextPage || paginationData.isLoading}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Save As New Project Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent className="sm:max-w-[425px]" data-testid="dialog-save-project">
            <DialogHeader>
              <DialogTitle>Save as New Project</DialogTitle>
              <DialogDescription>
                Create a new project with the <strong>{selectedForces.size}</strong> selected driving forces.
                {selectedForces.size > 0 ? (
                  <span className="block text-sm text-green-600 dark:text-green-400 mt-1">
                    ✓ Ready to create project with your selection
                  </span>
                ) : (
                  <span className="block text-sm text-red-600 dark:text-red-400 mt-1">
                    ⚠ Please select at least one force before proceeding
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => {
                // Final client-side validation
                if (selectedForces.size === 0) {
                  toast({
                    title: "No Forces Selected",
                    description: "Please select at least one driving force before creating a project.",
                    variant: "destructive",
                  });
                  return;
                }
                duplicateProjectMutation.mutate(data);
              })} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter project name..."
                          {...field}
                          data-testid="input-project-name"
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a descriptive name for your new project. Names must be unique.
                      </FormDescription>
                      {form.formState.errors.name && (
                        <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {form.formState.errors.name.message}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSaveDialogOpen(false)}
                    data-testid="button-cancel-save"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={duplicateProjectMutation.isPending || selectedForces.size === 0 || !form.formState.isValid}
                    data-testid="button-confirm-save"
                  >
                    {duplicateProjectMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      `Create Project with ${selectedForces.size} Force${selectedForces.size === 1 ? '' : 's'}`
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <Card>
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        {/* Top-level category tabs */}
        <div className="border-b border-border">
          <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0">
            <TabsTrigger
              value="curated"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-6 py-4"
              data-testid="tab-curated"
            >
              <Layers className="w-4 h-4 mr-2" />
              Curated Forces
              <Badge variant="secondary" className="ml-2">
                {curatedTotal.toLocaleString()}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="signals"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-6 py-4"
              data-testid="tab-signals"
            >
              Non-Curated Signals
              <Badge variant="secondary" className="ml-2">
                {signalsTotal.toLocaleString()}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="curated" className="mt-0">
          <div className="p-6">
            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  data-testid="button-toggle-curated-filters"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                  {(filters.dimensions.length > 0 || filters.types.length > 0) && (
                    <Badge variant="secondary" className="ml-2">
                      {filters.dimensions.length + filters.types.length}
                    </Badge>
                  )}
                </Button>

                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    placeholder="Search forces..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 w-64"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" data-testid="button-export">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {renderCuratedFilters()}

            {/* Unified Curated Forces Table */}
            <ForceTable
              forces={getFilteredForces("curated")}
              tabType="curated"
              isLoading={curatedForcesQuery.isLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="signals" className="mt-0">
          <div className="p-6">
            {/* Filters for signals */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Select
                  value={filters.steep}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, steep: value }))}
                >
                  <SelectTrigger className="w-48" data-testid="filter-cluster-signals">
                    <SelectValue placeholder="All Cluster Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cluster Categories</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Technological">Technological</SelectItem>
                    <SelectItem value="Economic">Economic</SelectItem>
                    <SelectItem value="Environmental">Environmental</SelectItem>
                    <SelectItem value="Political">Political</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    placeholder="Search signals..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 w-64"
                    data-testid="input-search-signals"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" data-testid="button-filter-signals">
                  <Filter className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="sm" data-testid="button-export-signals">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Non-Curated Signals Content */}
            {signalsTotal === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>No non-curated signals found.</strong> Signals represent the raw, unprocessed data from various sources before they are analyzed and curated into the strategic intelligence categories (Megatrends, Trends, Weak Signals & Wildcards). Import signal data to populate this section.
                </AlertDescription>
              </Alert>
            ) : (
              <ForceTable
                forces={getFilteredForces("signals")}
                tabType="signals"
                isLoading={signalsQuery.isLoading}
              />
            )}
          </div>
        </TabsContent>

      </Tabs>
    </Card>
  );
}