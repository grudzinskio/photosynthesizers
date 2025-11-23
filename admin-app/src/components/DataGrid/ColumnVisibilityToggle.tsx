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

const STORAGE_KEY = 'dataGrid_columnVisibility';

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
  // Store format: { [columnName]: boolean } - tracks visibility for all known columns
  const storedVisibilityRef = useRef<Record<string, boolean> | null>(null);
  if (storedVisibilityRef.current === null) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Support both old format (array) and new format (object)
        if (Array.isArray(parsed)) {
          // Migrate from old format: convert array to object
          const migrated: Record<string, boolean> = {};
          parsed.forEach((col: string) => {
            migrated[col] = true;
          });
          storedVisibilityRef.current = migrated;
          // Save migrated format
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } else {
          storedVisibilityRef.current = parsed;
        }
      } else {
        storedVisibilityRef.current = {};
      }
    } catch {
      storedVisibilityRef.current = {};
    }
  }

  // Initialize visible columns from stored preferences or default to all visible
  const [visibleColumns, setVisibleColumnsState] = useState<Set<string>>(() => {
    // If columns are empty, return empty set (will be updated when columns load)
    if (columns.length === 0) {
      return new Set<string>();
    }

    const stored = storedVisibilityRef.current;
    const visible = new Set<string>();

    columns.forEach((col) => {
      // If column has stored preference, use it; otherwise default to visible (true)
      const isVisible = stored?.[col] !== false;
      if (isVisible) {
        visible.add(col);
      }
    });

    return visible;
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

    const stored = storedVisibilityRef.current || {};

    // On first load with columns, initialize from stored preferences
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      const visible = new Set<string>();

      columns.forEach((col) => {
        // If column has stored preference, use it; otherwise default to visible (true)
        const isVisible = stored[col] !== false;
        if (isVisible) {
          visible.add(col);
        }
        // Ensure all current columns are in stored preferences
        if (!(col in stored)) {
          stored[col] = true;
        }
      });

      setVisibleColumnsState(visible);
      // Save the updated preferences
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        storedVisibilityRef.current = stored;
      } catch {
        // Ignore storage errors
      }
      prevColumnsRef.current = columnsKey;
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
      const updatedStored = { ...stored };

      // Remove columns that no longer exist
      prev.forEach((col) => {
        if (!columns.includes(col)) {
          updated.delete(col);
          delete updatedStored[col];
          hasChanges = true;
        }
      });

      // Handle new columns (visible by default) and existing columns (use stored preference)
      columns.forEach((col) => {
        const isVisible = stored[col] !== false; // Default to true if not in stored
        if (isVisible && !updated.has(col)) {
          updated.add(col);
          hasChanges = true;
        } else if (!isVisible && updated.has(col)) {
          updated.delete(col);
          hasChanges = true;
        }
        // Ensure all current columns are in stored preferences
        if (!(col in updatedStored)) {
          updatedStored[col] = isVisible;
        }
      });

      // Only return new Set if there were actual changes
      if (hasChanges) {
        // Persist changes
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStored));
          storedVisibilityRef.current = updatedStored;
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
      const isCurrentlyVisible = updated.has(column);
      
      if (isCurrentlyVisible) {
        updated.delete(column);
      } else {
        updated.add(column);
      }

      // Persist to localStorage
      try {
        const stored = storedVisibilityRef.current || {};
        stored[column] = !isCurrentlyVisible;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        storedVisibilityRef.current = stored;
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  };

  const setVisibleColumns = (newColumns: Set<string>) => {
    setVisibleColumnsState(newColumns);
    try {
      const stored: Record<string, boolean> = {};
      // Set visibility for all current columns
      columns.forEach((col) => {
        stored[col] = newColumns.has(col);
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      storedVisibilityRef.current = stored;
    } catch {
      // Ignore storage errors
    }
  };

  const resetToDefault = () => {
    const allVisible = new Set(columns);
    setVisibleColumnsState(allVisible);
    try {
      const stored: Record<string, boolean> = {};
      columns.forEach((col) => {
        stored[col] = true;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      storedVisibilityRef.current = stored;
    } catch {
      // Ignore storage errors
    }
  };

  return { visibleColumns, toggleColumn, setVisibleColumns, resetToDefault };
}


