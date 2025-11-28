import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Circle, Diamond, Star, Triangle, Info, Target, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAppStore, useAppActions, useHasHydrated, useCommittedRadarFilters, useSelectedForces, useSearchedForces, useScanningFilters } from '@/lib/store';

export interface RadarDataPoint {
  id: string;
  dimension: string;
  type: string;
  driving_force: string;
  description: string;
  magnitude: number;
  distance: number;
  color_hex: string;
  level_of_impact: number | null;
  feasibility: number;
  urgency: number;
  time_to_market: string | null;
  sentiment: string;
  source?: string;
}

interface RadarApiResponse {
  success: boolean;
  total: number;
  points: RadarDataPoint[];
  dimensions: string[];
  types: string[];
  timestamp: string;
}

interface CanvasRadarChartProps {
  projectId?: string;
  className?: string;
  onNodeClick?: (point: RadarDataPoint) => void;
}

export function CanvasRadarChart({
  projectId = '695ad788-c67f-460c-bff8-c51d63f1f9d1',
  className,
  onNodeClick
}: CanvasRadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<RadarDataPoint | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [sweepAngle, setSweepAngle] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
  const [showInfo, setShowInfo] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const animationRef = useRef<number>();

  // ... (rest of the component)



  // Helper function to convert hex to HSL for color sorting
  const hexToHsl = useCallback((hex: string) => {
    // Validate hex color format
    if (!/^#[0-9A-F]{6}$/i.test(hex)) {
      console.warn('Invalid hex color:', hex, 'using fallback');
      hex = '#64ffda'; // Use fallback color
    }

    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }, []);

  // Selection state from global store
  // Selection state from global store
  const selectedForcesSet = useSelectedForces();
  const selectedForcesArray = useMemo(() => Array.from(selectedForcesSet), [selectedForcesSet]);
  const selectedForces = selectedForcesSet; // Alias for compatibility

  const searchedForcesArray = useSearchedForces();
  const searchedForces = useMemo(() => new Set(searchedForcesArray), [searchedForcesArray]);
  const { selectForces } = useAppActions();

  // Wait for store hydration to prevent multiple queries during rehydration
  const hasHydrated = useHasHydrated();

  // Use committed radar filters from store (updated only via filter commit events)
  const filters = useCommittedRadarFilters();

  // Get showMode from scanning filters (updated by sidebar)
  const scanningFilters = useScanningFilters();
  const showMode = scanningFilters?.showMode || 'all';

  // Log when filters change
  useEffect(() => {
    console.log('[CanvasRadarChart] Committed filters updated:', filters);
  }, [filters]);

  // Fetch radar data from ORION API
  const { data: radarResponse, isLoading, error, refetch, isFetching } = useQuery<RadarApiResponse>({
    queryKey: ['/api/v1/analytics/radar', projectId, JSON.stringify(filters)],
    queryFn: async () => {
      // Transform filters to proper URL parameters format
      const queryParams = new URLSearchParams({
        project_id: projectId,
        // Always fetch all forces for Radar to ensure complete visualization and correct client-side filtering
        pageSize: '10000',
      });

      // NOTE: We always fetch all forces and filter client-side based on showMode
      // This ensures we have the complete dataset for 'all', 'searched', and 'selected' modes

      console.log('[CanvasRadarChart] API request:', `/api/v1/analytics/radar?${queryParams.toString()}`);

      const response = await apiRequest("GET", `/api/v1/analytics/radar?${queryParams}`);
      const data = await response.json();

      console.log('[CanvasRadarChart] API response:', {
        success: data.success,
        total: data.total,
        pointsLength: data.points?.length
      });

      return data;
    },
    enabled: !!projectId,
    refetchOnWindowFocus: false,
    // Keep previous data visible while fetching new data for smooth transitions
    placeholderData: (previousData) => previousData,
  });

  // Use radar data points
  const data = radarResponse?.points || [];

  // Debug query state once per change
  useEffect(() => {
    console.log('[CanvasRadarChart] Query state:', {
      hasHydrated,
      projectId,
      isLoading,
      isFetching,
      error: error?.message,
      hasData: !!radarResponse,
      dataLength: data.length,
      showMode: filters?.showMode
    });
  }, [hasHydrated, projectId, isLoading, isFetching, error, radarResponse, data.length, filters?.showMode]);

  // Filter data based on showMode
  const filteredData = useMemo(() => {
    if (showMode === 'selected') {
      // Show only selected forces
      return data.filter(point => selectedForces.has(point.id));
    } else if (showMode === 'searched') {
      // Show forces that were in the search results (cached from Scanning page)
      if (searchedForces.size > 0) {
        return data.filter(point => searchedForces.has(point.id));
      }
      // Fallback: if no searched forces cached, show all
      return data;
    } else {
      // Show all forces (default)
      return data;
    }
  }, [data, showMode, selectedForcesArray, selectedForces, searchedForcesArray, searchedForces]);

  // Sort data by color (HSL hue) for better visual distribution
  const sortedData = useMemo(() => {
    // Use filteredData instead of data to respect showMode filter
    if (!filteredData.length) return [];

    // Sort entire data array by dimension color for rainbow gradient
    return [...filteredData].sort((a, b) => {
      const aHsl = hexToHsl(a.color_hex);
      const bHsl = hexToHsl(b.color_hex);

      // Primary sort by hue for rainbow effect
      if (Math.abs(aHsl.h - bHsl.h) > 5) {
        return aHsl.h - bHsl.h;
      }
      // Secondary sort by saturation
      if (Math.abs(aHsl.s - bHsl.s) > 10) {
        return bHsl.s - aHsl.s;
      }
      // Tertiary sort by lightness
      return aHsl.l - bHsl.l;
    });
  }, [filteredData, hexToHsl]);

  // Clear hovered point when data changes to prevent stale tooltips
  useEffect(() => {
    setHoveredPoint(null);
  }, [sortedData]);

  const getTypeIcon = useCallback((type: string) => {
    const iconProps = { className: "w-4 h-4", strokeWidth: 2 };
    switch (type) {
      case 'Megatrend':
        return <Circle {...iconProps} fill="currentColor" />;
      case 'Trend':
        return <Diamond {...iconProps} fill="currentColor" />;
      case 'Wildcard':
      case 'Wild Card': // Handle both formats
        return <Star {...iconProps} fill="currentColor" />;
      case 'Weak Signal':
        return <Triangle {...iconProps} fill="currentColor" />;
      default:
        return <Circle {...iconProps} />;
    }
  }, []);





  // Auto-resize canvas based on container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Animation loop for the sweep
  useEffect(() => {
    const animate = () => {
      setSweepAngle(prev => (prev + 0.01) % (Math.PI * 2));
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Main canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isLoading) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;

    // Set high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - Math.min(width, height) * 0.005;

    // Guard against empty datasets
    if (sortedData.length === 0) {
      return;
    }

    // Create gradient background
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, '#ffffff05');
    gradient.addColorStop(0.5, '#ffffff02');
    gradient.addColorStop(1, '#00000000');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw concentric circles (gray with transparency)
    ctx.strokeStyle = '#6b727940';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 10; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius / 10) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw rotating light sweep
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(sweepAngle);

    // Create sweep gradient with electric blue
    if (ctx.createConicGradient) {
      const sweepGradient = ctx.createConicGradient(0, 0, 0);
      sweepGradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
      sweepGradient.addColorStop(0.1, 'rgba(0, 212, 255, 0.1)');
      sweepGradient.addColorStop(0.15, 'rgba(0, 212, 255, 0.3)');
      sweepGradient.addColorStop(0.2, 'rgba(0, 212, 255, 0.1)');
      sweepGradient.addColorStop(0.3, 'rgba(0, 212, 255, 0)');
      sweepGradient.addColorStop(1, 'rgba(0, 212, 255, 0)');

      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Draw axes for each data point (thin lines from center to each point)
    sortedData.forEach((point, index) => {
      // Position each force individually around the radar for distributed layout
      const angle = (index * 2 * Math.PI) / sortedData.length - Math.PI / 2;

      const radius = (point.distance / 10) * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Validate color for the line
      const isValidHex = /^#[0-9A-F]{6}$/i.test(point.color_hex);
      const color = isValidHex ? point.color_hex : '#64ffda';

      const isHovered = hoveredPoint === point;

      if (isHovered) {
        // Draw glow effect for hovered line
        ctx.strokeStyle = color + '15';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw illuminated line
        ctx.strokeStyle = color + '50';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        // Draw normal line
        ctx.strokeStyle = color + '40';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    });

    // Draw data points with size based on magnitude
    sortedData.forEach((point, index) => {
      // Position each force individually around the radar for distributed layout
      const angle = (index * 2 * Math.PI) / sortedData.length - Math.PI / 2;

      const radius = (point.distance / 10) * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Validate color_hex format
      const isValidHex = /^#[0-9A-F]{6}$/i.test(point.color_hex);
      const color = isValidHex ? point.color_hex : '#64ffda'; // fallback color

      // Scale point size based on magnitude (1-10 range maps to different sizes)
      const baseSize = 2;
      const maxSize = 10;
      const sizeMultiplier = baseSize + (point.magnitude / 10) * (maxSize - baseSize);
      const glowSize = sizeMultiplier * 2.5;

      // Check if point is selected
      const isSelected = selectedForces.has(point.id);

      // Draw glow effect (size varies with magnitude, enhanced if selected)
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, isSelected ? glowSize * 1.5 : glowSize);
      glowGradient.addColorStop(0, isSelected ? '#FFD700' + '80' : color + '80');
      glowGradient.addColorStop(1, isSelected ? '#FFD700' + '00' : color + '00');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? glowSize * 1.5 : glowSize, 0, 2 * Math.PI);
      ctx.fill();

      // Draw main point (size varies with magnitude, enhanced if selected)
      ctx.fillStyle = isSelected ? '#FFD700' : color;
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? sizeMultiplier * 1.3 : sizeMultiplier, 0, 2 * Math.PI);
      ctx.fill();

      // Add inner glow (size varies with magnitude)
      ctx.fillStyle = isSelected ? '#FFD700' + 'FF' : color + 'FF';
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? sizeMultiplier * 0.8 : sizeMultiplier * 0.6, 0, 2 * Math.PI);
      ctx.fill();

      // Add selection border for selected points
      if (isSelected) {
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, sizeMultiplier * 1.5, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // Draw center point
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 6);
    centerGradient.addColorStop(0, 'rgba(100, 255, 218, 1)');
    centerGradient.addColorStop(1, 'rgba(100, 255, 218, 0.3)');

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'rgba(100, 255, 218, 1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw labels for selected forces
    if (showLabels) {
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 1. Collect all labels to be drawn
      interface LabelData {
        text: string;
        x: number;
        y: number;
        width: number;
        height: number;
        point: RadarDataPoint;
        originalY: number;
      }

      const labels: LabelData[] = [];

      sortedData.forEach((point, index) => {
        // Only draw labels for selected forces
        if (!selectedForces.has(point.id)) return;

        const angle = (index * 2 * Math.PI) / sortedData.length - Math.PI / 2;
        const radius = (point.distance / 10) * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        // Calculate size to position label correctly
        const baseSize = 2;
        const maxSize = 10;
        const sizeMultiplier = baseSize + (point.magnitude / 10) * (maxSize - baseSize);
        const labelOffset = sizeMultiplier + 12;

        const labelText = point.driving_force;
        const metrics = ctx.measureText(labelText);
        const textWidth = metrics.width;
        const textHeight = 12;
        const padding = 4;

        // Initial position below the point
        const labelX = x;
        const labelY = y + labelOffset;

        labels.push({
          text: labelText,
          x: labelX,
          y: labelY,
          width: textWidth + padding * 2,
          height: textHeight + padding * 2,
          point: point,
          originalY: labelY
        });
      });

      // 2. Resolve collisions (simple iterative relaxation)
      const iterations = 10;
      for (let i = 0; i < iterations; i++) {
        for (let j = 0; j < labels.length; j++) {
          for (let k = j + 1; k < labels.length; k++) {
            const l1 = labels[j];
            const l2 = labels[k];

            // Check for overlap
            const dx = l1.x - l2.x;
            const dy = l1.y - l2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Simple bounding box overlap check
            const xOverlap = Math.abs(dx) < (l1.width + l2.width) / 2;
            const yOverlap = Math.abs(dy) < (l1.height + l2.height) / 2;

            if (xOverlap && yOverlap) {
              // Move labels apart vertically
              const overlapY = (l1.height + l2.height) / 2 - Math.abs(dy);
              const moveY = overlapY / 2 + 1; // Add a small buffer

              if (l1.y < l2.y) {
                l1.y -= moveY;
                l2.y += moveY;
              } else {
                l1.y += moveY;
                l2.y -= moveY;
              }
            }
          }
        }
      }

      // 3. Draw resolved labels
      labels.forEach(label => {
        // Draw connector line if label moved significantly
        if (Math.abs(label.y - label.originalY) > 5) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          // Find original point position (reverse engineering from label offset)
          // Or better, store point coordinates in LabelData. 
          // For now, just draw to the top of the label box area
          ctx.moveTo(label.x, label.originalY - 12); // Approx point location
          ctx.lineTo(label.x, label.y - label.height / 2);
          ctx.stroke();
        }

        // Draw background pill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(
          label.x - label.width / 2,
          label.y - label.height / 2,
          label.width,
          label.height,
          4
        );
        ctx.fill();

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label.text, label.x, label.y);
      });
    }

  }, [sortedData, dimensions, sweepAngle, isLoading, hoveredPoint, selectedForces, showLabels]);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    setMousePos({ x: event.clientX, y: event.clientY });

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - Math.min(width, height) * 0.005;

    // Check if mouse is near any point (considering variable sizes)
    let closestPoint: RadarDataPoint | null = null;
    let minDistance = Infinity;

    sortedData.forEach((point, index) => {
      // Use same individual positioning as in drawing
      const angle = (index * 2 * Math.PI) / sortedData.length - Math.PI / 2;

      const radius = (point.distance / 10) * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Calculate size based on magnitude for hit detection
      const baseSize = 2;
      const maxSize = 10;
      const sizeMultiplier = baseSize + (point.magnitude / 10) * (maxSize - baseSize);
      const hitRadius = sizeMultiplier + 8; // Larger hit area for better interaction

      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      if (distance < hitRadius && distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    setHoveredPoint(closestPoint);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('[CanvasRadarChart] Click ignored - no canvas');
      return;
    }

    // Calculate click coordinates
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - Math.min(width, height) * 0.005;

    // Find the closest point to the click (same logic as hover detection)
    let clickedPoint: RadarDataPoint | null = null;
    let minDistance = Infinity;

    sortedData.forEach((point, index) => {
      const angle = (index * 2 * Math.PI) / sortedData.length - Math.PI / 2;
      const radius = (point.distance / 10) * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const baseSize = 2;
      const maxSize = 10;
      const sizeMultiplier = baseSize + (point.magnitude / 10) * (maxSize - baseSize);
      const hitRadius = sizeMultiplier + 8;

      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      if (distance < hitRadius && distance < minDistance) {
        minDistance = distance;
        clickedPoint = point;
      }
    });

    if (!clickedPoint) {
      console.log('[CanvasRadarChart] Click ignored - no point at coordinates', { mouseX, mouseY });
      return;
    }

    // Type assertion after null check
    const point: RadarDataPoint = clickedPoint;
    const forceId = point.id;
    const isCurrentlySelected = selectedForces.has(forceId);
    const mode = isCurrentlySelected ? 'remove' : 'add';

    console.log('[CanvasRadarChart] Click registered:', {
      forceId,
      forceTitle: point.driving_force,
      isCurrentlySelected,
      mode,
      currentSelectionCount: selectedForces.size,
      currentSelection: Array.from(selectedForces).slice(0, 3)
    });

    // Check if Ctrl (Windows/Linux) or Cmd (Mac) key is pressed
    const isModifierClick = event.ctrlKey || event.metaKey;

    if (isModifierClick) {
      // Ctrl/Cmd+Click: Toggle selection without opening detail panel
      selectForces([forceId], mode);
      console.log('[CanvasRadarChart] Modifier click - toggling selection');
    } else {
      // Regular click: Open detail panel without changing selection
      // This prevents radar reload by not modifying selectedForcesArray
      console.log('[CanvasRadarChart] Regular click - opening detail panel', {
        hasOnNodeClick: !!onNodeClick,
        pointId: point.id,
        pointTitle: point.driving_force
      });
      if (onNodeClick) {
        console.log('[CanvasRadarChart] Calling onNodeClick with point:', point);
        onNodeClick(point);
      } else {
        console.warn('[CanvasRadarChart] onNodeClick is not defined!');
      }
    }

    // Log after a brief delay to see if state updated
    setTimeout(() => {
      const state = useAppStore.getState();
      const newSelection = state.currentProjectId ? (state.projectStates[state.currentProjectId]?.selectedForces || []) : [];
      console.log('[CanvasRadarChart] After click state:', {
        newSelectionCount: newSelection.length,
        sampleIds: newSelection.slice(0, 3)
      });
    }, 100);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };



  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive" data-testid="canvas-radar-error">
          <AlertDescription>
            Failed to load radar data: {error instanceof Error ? error.message : 'Unknown error'}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Card className={`${className} flex flex-col`} data-testid="canvas-radar-chart">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Strategic Intelligence Radar</CardTitle>
            {isFetching && radarResponse && (
              <Badge variant="outline" className="text-xs animate-pulse">
                Updating...
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sortedData.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLabels(!showLabels)}
                  className="flex items-center space-x-2"
                  data-testid="button-toggle-labels"
                >
                  {showLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showLabels ? 'Hide Labels' : 'Show Labels'}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <div className="p-2 flex-1 min-h-0">
        {/* Chart container */}
        <div className="h-full w-full" ref={containerRef}>
          {sortedData.length === 0 ? (
            <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No data available for radar visualization</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <canvas
                ref={canvasRef}
                className="cursor-crosshair w-full h-full"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleCanvasClick}
                data-testid="canvas-radar-canvas"
              />

              {/* Info Button */}
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-4 right-4 w-8 h-8 bg-card/90 backdrop-blur-sm border-muted-foreground/20 hover:bg-card z-10"
                onClick={() => setShowInfo(!showInfo)}
                data-testid="canvas-radar-info-button"
              >
                <Info className="w-4 h-4" />
              </Button>

              {/* Info Box */}
              {showInfo && (
                <Card className="absolute bottom-16 right-4 w-80 bg-card/95 backdrop-blur-sm border-muted-foreground/20 z-10 animate-fade-in">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Canvas Radar Interpretation</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <h4 className="font-medium text-primary text-sm">Node Size</h4>
                      <p className="text-xs text-muted-foreground">
                        Larger nodes represent driving forces with higher scope
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-primary text-sm">Distance from Center</h4>
                      <p className="text-xs text-muted-foreground">
                        Distance represents the level of impact level of the driving force (in a generic way)
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-primary text-sm">Color Coding</h4>
                      <p className="text-xs text-muted-foreground">
                        Colors represent the dimensions of the Driving Forces
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Interactive tooltip */}
              {hoveredPoint && (
                <div
                  className="fixed z-[9999] pointer-events-none"
                  style={{
                    left: mousePos.x + 10,
                    top: mousePos.y - 10
                  }}
                  data-testid="canvas-radar-tooltip"
                >
                  <Card className="p-3 border-primary/20 bg-card/95 backdrop-blur-sm max-w-sm">
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {hoveredPoint.dimension} • {hoveredPoint.type}
                      </div>
                      <div
                        className="text-lg font-semibold"
                        style={{
                          color: /^#[0-9A-F]{6}$/i.test(hoveredPoint.color_hex)
                            ? hoveredPoint.color_hex
                            : '#64ffda'
                        }}
                      >
                        {hoveredPoint.driving_force}
                      </div>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(hoveredPoint.type)}
                        <span className="text-xs text-muted-foreground">{hoveredPoint.sentiment}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Magnitude: {hoveredPoint.magnitude}</span>
                        <span>•</span>
                        <span>Impact: {hoveredPoint.distance}</span>
                      </div>
                      {hoveredPoint.time_to_market && (
                        <div className="text-xs text-muted-foreground">
                          TTM: {hoveredPoint.time_to_market}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}