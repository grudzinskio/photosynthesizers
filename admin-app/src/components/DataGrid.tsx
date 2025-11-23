import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw, Database, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  getPlantsFromDatabase, 
  getDomesFromDatabase, 
  type DatabasePlantsResponse, 
  type DatabaseDomesResponse 
} from '@/lib/api';
import { useSettings } from '@/contexts/SettingsContext';
import { ColumnVisibilityToggle, useColumnVisibility } from './DataGrid/ColumnVisibilityToggle';
import { ColumnFilterPopover } from './DataGrid/ColumnFilterPopover';
import { 
  formatColumnName, 
  formatDateTime, 
  formatBoolean,
  compareQtyValues,
  loadColumnFilters, 
  saveColumnFilters 
} from './DataGrid/utils';

const ITEMS_PER_PAGE = 50;

type SortConfig = {
  column: string;
  direction: 'asc' | 'desc';
} | null;

export function DataGrid() {
  const { settings } = useSettings();
  const [domes, setDomes] = useState<string[]>([]);
  const [selectedDome, setSelectedDome] = useState<string>('');
  const [allPlants, setAllPlants] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(() => loadColumnFilters());
  
  // Column visibility with localStorage persistence
  // Initialize with empty array, will be updated when columns are loaded
  const { visibleColumns, toggleColumn, resetToDefault: resetColumnVisibility } = useColumnVisibility(columns.length > 0 ? columns : []);

  useEffect(() => {
    loadDomes();
  }, [settings.apiBaseUrl]);

  useEffect(() => {
    loadPlants();
  }, [selectedDome, settings.apiBaseUrl]);

  const loadDomes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: DatabaseDomesResponse = await getDomesFromDatabase(settings.apiBaseUrl);
      if (response.success && response.domes.length > 0) {
        setDomes(response.domes);
        setSelectedDome(response.domes[0]);
      } else {
        setDomes([]);
        setSelectedDome('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load domes from database');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlants = async () => {
    setIsLoadingPlants(true);
    setError(null);
    try {
      // Fetch ALL plants (use large limit to get everything)
      // Filtering and pagination will happen client-side
      const response: DatabasePlantsResponse = await getPlantsFromDatabase(
        selectedDome || null,
        50000, // Large limit to get all plants (backend max is 50000)
        0,
        settings.apiBaseUrl
      );
      if (response.success) {
        setAllPlants(response.plants);
        setTotal(response.total);
        
        // Extract column names from first plant if available, excluding 'id' and 'updated_at'
        if (response.plants.length > 0) {
          const allColumns = Object.keys(response.plants[0]);
          // Filter out 'id' and 'updated_at', ensure image_count is included
          const filteredColumns = allColumns.filter(col => col !== 'id' && col !== 'updated_at');
          if (!filteredColumns.includes('image_count')) {
            filteredColumns.push('image_count');
          }
          setColumns(filteredColumns);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plants from database');
    } finally {
      setIsLoadingPlants(false);
    }
  };

  // Filter and sort plants
  const filteredAndSortedPlants = useMemo(() => {
    let filtered = [...allPlants];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(plant =>
        Object.values(plant).some(value =>
          value !== null && value !== undefined && String(value).toLowerCase().includes(query)
        )
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue.trim()) {
        const query = filterValue.toLowerCase();
        filtered = filtered.filter(plant => {
          const value = plant[column];
          if (value === null || value === undefined) return false;
          
          // Handle boolean columns
          if (typeof value === 'boolean' || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'false') {
            const boolVal = value === true || String(value).toLowerCase() === 'true';
            const filterBool = query === 'yes' || query === 'true';
            return boolVal === filterBool;
          }
          
          // Handle text filters
          return String(value).toLowerCase().includes(query);
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.column];
        const bValue = b[sortConfig.column];
        
        // Handle null/undefined values
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        // Special handling for qty column
        if (sortConfig.column === 'qty') {
          return compareQtyValues(aValue, bValue, sortConfig.direction);
        }
        
        // Handle numeric values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle boolean values
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          if (sortConfig.direction === 'asc') {
            return aValue === bValue ? 0 : aValue ? 1 : -1;
          } else {
            return aValue === bValue ? 0 : aValue ? -1 : 1;
          }
        }
        
        // Handle string values
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return filtered;
  }, [allPlants, searchQuery, columnFilters, sortConfig]);

  // Paginate filtered results
  const paginatedPlants = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredAndSortedPlants.slice(start, end);
  }, [filteredAndSortedPlants, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedPlants.length / ITEMS_PER_PAGE);
  const displayTotal = filteredAndSortedPlants.length;

  const handleSort = (column: string) => {
    setSortConfig(current => {
      if (current?.column === column) {
        if (current.direction === 'asc') {
          return { column, direction: 'desc' };
        } else {
          return null;
        }
      } else {
        return { column, direction: 'asc' };
      }
    });
    setCurrentPage(0);
  };

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => {
      const updated = { ...prev };
      if (value.trim()) {
        updated[column] = value;
      } else {
        delete updated[column];
      }
      // Persist to localStorage
      saveColumnFilters(updated);
      return updated;
    });
    setCurrentPage(0);
  };

  const handleClearColumnFilter = (column: string) => {
    setColumnFilters(prev => {
      const updated = { ...prev };
      delete updated[column];
      // Persist to localStorage
      saveColumnFilters(updated);
      return updated;
    });
    setCurrentPage(0);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setColumnFilters({});
    saveColumnFilters({});
    setSortConfig(null);
    setCurrentPage(0);
  };

  const resetEverything = () => {
    resetAllFilters();
    resetColumnVisibility();
  };

  // Determine which columns are boolean
  const booleanColumns = useMemo(() => {
    if (allPlants.length === 0) return new Set<string>();
    const boolCols = new Set<string>();
    columns.forEach(col => {
      const sampleValue = allPlants[0]?.[col];
      if (typeof sampleValue === 'boolean') {
        boolCols.add(col);
      }
    });
    return boolCols;
  }, [allPlants, columns]);

  // Filter visible columns
  // Convert Set to sorted array string for dependency tracking
  const visibleColumnsKey = useMemo(() => {
    if (!visibleColumns || !(visibleColumns instanceof Set)) {
      return '';
    }
    return Array.from(visibleColumns).sort().join(',');
  }, [visibleColumns]);

  const visibleColumnsList = useMemo(() => {
    if (!visibleColumns || !(visibleColumns instanceof Set)) {
      return columns; // Fallback to all columns if Set is not available
    }
    return columns.filter(col => visibleColumns.has(col));
  }, [columns, visibleColumnsKey]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Grid</CardTitle>
          <CardDescription>View plant data in a table format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !domes.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Grid</CardTitle>
          <CardDescription>View plant data in a table format</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadDomes} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (domes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Grid</CardTitle>
          <CardDescription>View plant data in a table format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No plants found in database.</p>
            <p className="text-sm mt-2">Upload an Excel file in Settings to add plants to the database.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Grid</CardTitle>
            <CardDescription>View plant data in a table format</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityToggle
              columns={columns}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
            {(searchQuery || Object.keys(columnFilters).length > 0 || sortConfig || (visibleColumns.size < columns.length)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetEverything}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Reset All
              </Button>
            )}
            <Button onClick={loadDomes} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dome Selector and Search */}
        <div className="flex items-center gap-4 flex-wrap">
          <label htmlFor="dome-select" className="text-sm font-medium">
            Filter by Dome:
          </label>
          <select
            id="dome-select"
            value={selectedDome}
            onChange={(e) => {
              setSelectedDome(e.target.value);
              setCurrentPage(0);
            }}
            className="flex h-9 w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Domes</option>
            {domes.map((dome) => (
              <option key={dome} value={dome}>
                {dome}
              </option>
            ))}
          </select>
          
          {/* Global Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search all columns..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-9"
            />
          </div>

        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Data Table */}
        {isLoadingPlants ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedPlants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {allPlants.length === 0 
              ? 'No plants found in this dome.'
              : 'No plants match your search criteria.'}
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              Showing {paginatedPlants.length} of {displayTotal} plants
              {displayTotal !== total && ` (${total} total in database)`}
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    {visibleColumnsList.map((column) => {
                      const isSorted = sortConfig?.column === column;
                      const sortDirection = isSorted ? sortConfig.direction : null;
                      return (
                        <th
                          key={column}
                          className="px-4 py-3 text-left text-sm font-medium text-muted-foreground border-b"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSort(column)}
                              className="flex items-center gap-1 hover:text-foreground transition-colors flex-1"
                            >
                              {formatColumnName(column)}
                              {isSorted ? (
                                sortDirection === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </button>
                            <ColumnFilterPopover
                              column={column}
                              value={columnFilters[column] || ''}
                              onFilterChange={(value) => handleColumnFilter(column, value)}
                              onClear={() => handleClearColumnFilter(column)}
                              allPlants={allPlants}
                              isBoolean={booleanColumns.has(column)}
                              otherFilters={columnFilters}
                              searchQuery={searchQuery}
                            />
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlants.map((plant, idx) => (
                    <tr
                      key={idx}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      {visibleColumnsList.map((column) => {
                        const value = plant[column];
                        let displayValue: string;
                        
                        if (value === null || value === undefined) {
                          displayValue = '-';
                        } else if (column === 'created_at') {
                          displayValue = formatDateTime(value);
                        } else if (booleanColumns.has(column)) {
                          displayValue = formatBoolean(value);
                        } else {
                          displayValue = String(value);
                        }
                        
                        return (
                          <td
                            key={column}
                            className="px-4 py-2 text-sm"
                          >
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages} ({displayTotal} {displayTotal === 1 ? 'plant' : 'plants'} shown)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0 || isLoadingPlants}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1 || isLoadingPlants}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

