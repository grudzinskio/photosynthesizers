import { useState, useEffect, useRef, useMemo } from 'react';
import { Columns, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatColumnName } from './utils';

interface ColumnVisibilityToggleProps {
  columns: string[];
  visibleColumns: Set<string>;
  onToggleColumn: (column: string) => void;
}

const STORAGE_KEY = 'dataGrid_visibleColumns';

export function ColumnVisibilityToggle({
  columns,
  visibleColumns,
  onToggleColumn,
}: ColumnVisibilityToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Columns className="h-4 w-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Toggle Columns</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {columns.map((column) => {
              const isVisible = visibleColumns.has(column);
              return (
                <div
                  key={column}
                  className="flex items-center space-x-2 py-1"
                >
                  <Checkbox
                    id={`column-${column}`}
                    checked={isVisible}
                    onCheckedChange={() => onToggleColumn(column)}
                  />
                  <Label
                    htmlFor={`column-${column}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {formatColumnName(column)}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function useColumnVisibility(columns: string[]): {
  visibleColumns: Set<string>;
  toggleColumn: (column: string) => void;
  setVisibleColumns: (columns: Set<string>) => void;
  resetToDefault: () => void;
} {
  // Load persisted preferences on init (only once)
  const storedVisibleRef = useRef<string[] | null>(null);
  if (storedVisibleRef.current === null) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        storedVisibleRef.current = JSON.parse(stored);
      } else {
        storedVisibleRef.current = [];
      }
    } catch {
      storedVisibleRef.current = [];
    }
  }

  // Initialize visible columns from stored preferences or default to all visible
  const [visibleColumns, setVisibleColumnsState] = useState<Set<string>>(() => {
    // If columns are empty, return empty set (will be updated when columns load)
    if (columns.length === 0) {
      return new Set<string>();
    }

    // If we have stored preferences, use them
    const stored = storedVisibleRef.current;
    if (stored && stored.length > 0) {
      // Filter stored to only include columns that still exist
      const validStored = stored.filter(col => columns.includes(col));
      if (validStored.length > 0) {
        const visible = new Set(validStored);
        // Add any new columns that weren't in stored (visible by default)
        columns.forEach(col => {
          if (!visible.has(col)) {
            visible.add(col);
          }
        });
        return visible;
      }
    }
    // Default: all columns visible
    return new Set(columns);
  });

  // Create a stable key for columns to use as dependency
  const columnsKey = useMemo(() => [...columns].sort().join(','), [columns]);
  const prevColumnsRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Skip if columns are empty (not loaded yet)
    if (columns.length === 0) {
      return;
    }

    // On first load with columns, initialize from stored preferences
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      const stored = storedVisibleRef.current;
      if (stored && stored.length > 0) {
        const validStored = stored.filter(col => columns.includes(col));
        if (validStored.length > 0) {
          const visible = new Set(validStored);
          // Add any new columns that weren't in stored
          columns.forEach(col => {
            if (!visible.has(col)) {
              visible.add(col);
            }
          });
          setVisibleColumnsState(visible);
          // Save the updated set
          try {
            const visibleArray = Array.from(visible);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleArray));
            storedVisibleRef.current = visibleArray;
          } catch {
            // Ignore storage errors
          }
          return;
        }
      }
      // No stored preferences, use all columns
      const allVisible = new Set(columns);
      setVisibleColumnsState(allVisible);
      try {
        const visibleArray = Array.from(allVisible);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleArray));
        storedVisibleRef.current = visibleArray;
      } catch {
        // Ignore storage errors
      }
      return;
    }

    // Only update if columns actually changed
    if (prevColumnsRef.current === columnsKey) {
      return;
    }
    prevColumnsRef.current = columnsKey;

    // Sync with columns when they change (after initial load)
    setVisibleColumnsState((prev) => {
      const updated = new Set(prev);
      let hasChanges = false;

      // Remove columns that no longer exist
      prev.forEach((col) => {
        if (!columns.includes(col)) {
          updated.delete(col);
          hasChanges = true;
        }
      });
      // Add new columns (visible by default)
      columns.forEach((col) => {
        if (!updated.has(col)) {
          updated.add(col);
          hasChanges = true;
        }
      });

      // Only return new Set if there were actual changes
      if (hasChanges) {
        // Persist changes
        try {
          const visibleArray = Array.from(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleArray));
          storedVisibleRef.current = visibleArray;
        } catch {
          // Ignore storage errors
        }
        return updated;
      }
      return prev;
    });
  }, [columnsKey, columns]);

  const toggleColumn = (column: string) => {
    setVisibleColumnsState((prev) => {
      const updated = new Set(prev);
      if (updated.has(column)) {
        updated.delete(column);
      } else {
        updated.add(column);
      }
      // Persist to localStorage
      try {
        const visibleArray = Array.from(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleArray));
        storedVisibleRef.current = visibleArray;
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  };

  const setVisibleColumns = (newColumns: Set<string>) => {
    setVisibleColumnsState(newColumns);
    try {
      const visibleArray = Array.from(newColumns);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleArray));
      storedVisibleRef.current = visibleArray;
    } catch {
      // Ignore storage errors
    }
  };

  const resetToDefault = () => {
    const allVisible = new Set(columns);
    setVisibleColumnsState(allVisible);
    try {
      const visibleArray = Array.from(allVisible);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleArray));
      storedVisibleRef.current = visibleArray;
    } catch {
      // Ignore storage errors
    }
  };

  return { visibleColumns, toggleColumn, setVisibleColumns, resetToDefault };
}


