import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import type { DrivingForceType } from "../types";

interface DrivingForceTypeMenuProps {
  selected: Set<DrivingForceType>;
  onToggle: (type: DrivingForceType) => void;
  onSelectAll: () => void;
  onClear: () => void;
  counts?: Record<DrivingForceType, number>;
}

export function DrivingForceTypeMenu({
  selected,
  onToggle,
  onSelectAll,
  onClear,
  counts = {} as Record<DrivingForceType, number>,
}: DrivingForceTypeMenuProps) {
  const types: DrivingForceType[] = ['Megatrend', 'Trend', 'Weak Signal', 'Wildcard'];
  
  const allSelected = types.every(t => selected.has(t));
  const noneSelected = selected.size === 0;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="driving-force-type-menu">
      <span className="text-sm font-medium text-muted-foreground">Type:</span>
      
      <div className="flex flex-wrap gap-1">
        {types.map((type) => {
          const isSelected = selected.has(type);
          const count = counts[type] || 0;
          
          return (
            <Toggle
              key={type}
              pressed={isSelected}
              onPressedChange={() => onToggle(type)}
              className="gap-1.5"
              data-testid={`toggle-type-${type.toLowerCase().replace(' ', '-')}`}
            >
              {type}
              {count > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                  {count}
                </Badge>
              )}
            </Toggle>
          );
        })}
      </div>

      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          disabled={allSelected}
          data-testid="button-select-all-types"
        >
          All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={noneSelected}
          data-testid="button-clear-types"
        >
          None
        </Button>
      </div>
    </div>
  );
}
