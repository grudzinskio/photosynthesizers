import { useState, useEffect, useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatColumnName } from './utils';

interface ColumnFilterPopoverProps {
  column: string;
  value: string;
  onFilterChange: (value: string) => void;
  onClear: () => void;
  allPlants: Record<string, unknown>[];
  isBoolean?: boolean;
  otherFilters?: Record<string, string>;
  searchQuery?: string;
}

export function ColumnFilterPopover({
  column,
  value,
  onFilterChange,
  onClear,
  allPlants,
  isBoolean = false,
  otherFilters = {},
  searchQuery = '',
}: ColumnFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Calculate live preview of filtered results
  const previewCount = useMemo(() => {
    let filtered = [...allPlants];

    // Apply global search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(plant =>
        Object.values(plant).some(val =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(query)
        )
      );
    }

    // Apply other column filters
    Object.entries(otherFilters).forEach(([col, filterValue]) => {
      if (col !== column && filterValue.trim()) {
        const query = filterValue.toLowerCase();
        filtered = filtered.filter(plant => {
          const val = plant[col];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      }
    });

    // Apply this column's filter with local value
    if (localValue.trim()) {
      const query = localValue.toLowerCase();
      filtered = filtered.filter(plant => {
        const val = plant[column];
        if (val === null || val === undefined) return false;
        
        if (isBoolean) {
          // For boolean columns, match against "yes"/"no"
          const boolVal = val === true || String(val).toLowerCase() === 'true';
          const filterBool = query === 'yes' || query === 'true';
          return boolVal === filterBool;
        }
        
        return String(val).toLowerCase().includes(query);
      });
    }

    return filtered.length;
  }, [allPlants, localValue, column, isBoolean, otherFilters, searchQuery]);

  const handleApply = () => {
    onFilterChange(localValue);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalValue('');
    onClear();
    setOpen(false);
  };

  const handleReset = () => {
    setLocalValue('');
    onClear();
  };

  const hasFilter = value.trim().length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            "h-6 w-6 p-0",
            hasFilter && "bg-primary/10 text-primary"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filter {formatColumnName(column)}</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {isBoolean ? (
            // Boolean filter with select dropdown
            <div className="space-y-2">
              <Label htmlFor={`filter-${column}`} className="text-xs text-muted-foreground">
                Filter by {formatColumnName(column)}
              </Label>
              <Select
                value={localValue || 'all'}
                onValueChange={(val) => setLocalValue(val === 'all' ? '' : val)}
              >
                <SelectTrigger id={`filter-${column}`}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {localValue && (
                <p className="text-xs text-muted-foreground">
                  Showing {previewCount} of {allPlants.length} plants
                </p>
              )}
            </div>
          ) : (
            // Text filter with live preview
            <div className="space-y-2">
              <Label htmlFor={`filter-${column}`} className="text-xs text-muted-foreground">
                Filter by {formatColumnName(column)}
              </Label>
              <Input
                id={`filter-${column}`}
                type="text"
                placeholder="Enter filter text..."
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApply();
                  }
                }}
                autoFocus
              />
              {localValue && (
                <p className="text-xs text-muted-foreground">
                  Showing {previewCount} of {allPlants.length} plants
                </p>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2"
              disabled={!hasFilter && !localValue.trim()}
            >
              <X className="h-3 w-3" />
              Reset
            </Button>
            <div className="flex gap-2">
              {hasFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="gap-2"
                >
                  Clear
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={handleApply}
                disabled={localValue === value}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
