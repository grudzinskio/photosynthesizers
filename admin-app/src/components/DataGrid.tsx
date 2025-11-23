import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw, Database, Search, ArrowUpDown, ArrowUp, ArrowDown, X, Image as ImageIcon, Calendar, User, Heart, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { 
  getPlantsFromDatabase, 
  getDomesFromDatabase, 
  getImagesByPlantId,
  type DatabasePlantsResponse, 
  type DatabaseDomesResponse,
  type PlantImagesResponse
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

// Health status helper functions
const getHealthStatusColor = (healthStatus: string | null | undefined): string => {
  if (!healthStatus) return 'bg-gray-100 hover:bg-gray-200';
  
  switch (healthStatus.toLowerCase()) {
    case 'healthy':
      return 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500';
    case 'watch':
      return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500';
    case 'declining':
      return 'bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-500';
    case 'critical':
      return 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500';
    default:
      return 'bg-gray-100 hover:bg-gray-200';
  }
};

const getHealthStatusIcon = (healthStatus: string | null | undefined) => {
  if (!healthStatus) return null;
  
  switch (healthStatus.toLowerCase()) {
    case 'healthy':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'watch':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'declining':
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return null;
  }
};


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
  const [selectedPlant, setSelectedPlant] = useState<Record<string, unknown> | null>(null);
  const [plantImages, setPlantImages] = useState<PlantImagesResponse['images']>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
        setSelectedDome(''); // Default to "All Domes"
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
        
        // Extract column names from first plant if available, excluding 'id', 'updated_at', and 'latest_health_confidence'
        if (response.plants.length > 0) {
          const allColumns = Object.keys(response.plants[0]);
          // Filter out 'id', 'updated_at', and 'latest_health_confidence', ensure image_count is included
          const filteredColumns = allColumns.filter(col => 
            col !== 'id' && 
            col !== 'updated_at' && 
            col !== 'latest_health_confidence'
          );
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

  const handleRowClick = async (plant: Record<string, unknown>) => {
    const plantId = plant.id as string;
    if (!plantId) return;

    setSelectedPlant(plant);
    setIsDialogOpen(true);
    setIsLoadingImages(true);
    setImagesError(null);
    setPlantImages([]);

    try {
      const response = await getImagesByPlantId(plantId, settings.apiBaseUrl);
      setPlantImages(response.images);
    } catch (err) {
      setImagesError(err instanceof Error ? err.message : 'Failed to load images');
      console.error('Error fetching plant images:', err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
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
    <Card className="pt-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
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

        {/* Top Pagination */}
        {!isLoadingPlants && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages} • Showing {paginatedPlants.length} of {displayTotal} plants
              {displayTotal !== total && ` (${total} total in database)`}
            </div>
            <div className="flex gap-2">
              <ColumnVisibilityToggle
                columns={columns}
                visibleColumns={visibleColumns}
                onToggleColumn={toggleColumn}
              />
              <Button onClick={loadDomes} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
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
                  {paginatedPlants.map((plant, idx) => {
                    // Get health status from plant data (preloaded from API)
                    const healthStatus = (plant.latest_health_status as string | null | undefined) || null;
                    const rowColorClass = getHealthStatusColor(healthStatus);
                    
                    return (
                    <tr
                      key={idx}
                      className={`border-b transition-colors cursor-pointer ${rowColorClass}`}
                      onClick={() => handleRowClick(plant)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages} • Showing {paginatedPlants.length} of {displayTotal} plants
                  {displayTotal !== total && ` (${total} total in database)`}
                </div>
                <div className="flex gap-2">
                  <ColumnVisibilityToggle
                    columns={columns}
                    visibleColumns={visibleColumns}
                    onToggleColumn={toggleColumn}
                  />
                  <Button onClick={loadDomes} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
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

      {/* Plant Images Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogHeader>
          <DialogTitle>
            {selectedPlant 
              ? `Images for ${String(selectedPlant.common_name || selectedPlant.scientific_name || 'Plant')}${selectedPlant.scientific_name && selectedPlant.common_name ? ` (${String(selectedPlant.scientific_name)})` : ''}`
              : 'Plant Images'
            }
          </DialogTitle>
          <DialogDescription>
            {plantImages.length > 0 && `${plantImages.length} image${plantImages.length === 1 ? '' : 's'} uploaded by users`}
          </DialogDescription>
          <DialogClose onClose={() => setIsDialogOpen(false)} />
        </DialogHeader>
        <DialogContent>
          {isLoadingImages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : imagesError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{imagesError}</AlertDescription>
            </Alert>
          ) : plantImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images found for this plant.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Latest Health Assessment Summary */}
              {(() => {
                const latestHealthImage = plantImages
                  .filter(img => img.health_status && img.health_assessment)
                  .sort((a, b) => {
                    const dateA = new Date(a.uploaded_at || 0).getTime();
                    const dateB = new Date(b.uploaded_at || 0).getTime();
                    return dateB - dateA;
                  })[0];
                
                if (latestHealthImage && latestHealthImage.health_assessment) {
                  const assessment = typeof latestHealthImage.health_assessment === 'string' 
                    ? JSON.parse(latestHealthImage.health_assessment)
                    : latestHealthImage.health_assessment;
                  
                  return (
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Heart className="h-5 w-5" />
                          <CardTitle className="text-lg">Latest Health Assessment</CardTitle>
                          {getHealthStatusIcon(latestHealthImage.health_status)}
                          <span className={`text-sm font-semibold ${
                            latestHealthImage.health_status === 'healthy' ? 'text-green-600' :
                            latestHealthImage.health_status === 'watch' ? 'text-yellow-600' :
                            latestHealthImage.health_status === 'declining' ? 'text-orange-600' :
                            latestHealthImage.health_status === 'critical' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {latestHealthImage.health_status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                          {latestHealthImage.health_score !== null && latestHealthImage.health_score !== undefined && (
                            <span className="text-sm text-muted-foreground">
                              (Score: {latestHealthImage.health_score}/100)
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Visual Observations */}
                        {assessment.visual_observations && assessment.visual_observations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Observations:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {assessment.visual_observations.map((obs: string, idx: number) => (
                                <li key={idx}>{obs}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Issues Detected */}
                        {assessment.issues_detected && assessment.issues_detected.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 text-orange-600">Issues Detected:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {assessment.issues_detected.map((issue: any, idx: number) => (
                                <li key={idx} className="text-muted-foreground">
                                  <span className="font-medium">{issue.issue}</span>
                                  {issue.severity && ` (${issue.severity})`}
                                  {issue.confidence && ` - ${Math.round(issue.confidence * 100)}% confidence`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Recommended Actions */}
                        {assessment.recommended_actions && assessment.recommended_actions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 text-blue-600">Recommended Actions:</h4>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                              {assessment.recommended_actions.map((action: any, idx: number) => (
                                <li key={idx} className="text-muted-foreground">
                                  <span className={`font-medium ${
                                    action.urgency === 'immediate' ? 'text-red-600' :
                                    action.urgency === 'within_week' ? 'text-orange-600' :
                                    'text-blue-600'
                                  }`}>
                                    [{action.urgency?.replace('_', ' ').toUpperCase() || 'ROUTINE'}]
                                  </span>
                                  {' '}{action.action}
                                  {action.reason && (
                                    <span className="block text-xs text-muted-foreground ml-4 mt-1">
                                      Reason: {action.reason}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Monitoring Notes */}
                        {assessment.monitoring_notes && (
                          <div className="pt-2 border-t">
                            <h4 className="text-sm font-semibold mb-1">Monitoring Notes:</h4>
                            <p className="text-sm text-muted-foreground">{assessment.monitoring_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })()}
              
              {/* Images Grid */}
              <div>
                <h3 className="text-lg font-semibold mb-4">All Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plantImages.map((image) => {
                    const plant = image.plants;
                    const hasHealthData = image.health_status || image.health_assessment;
                    const assessment = image.health_assessment 
                      ? (typeof image.health_assessment === 'string' 
                          ? JSON.parse(image.health_assessment)
                          : image.health_assessment)
                      : null;
                    
                    return (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted relative">
                          {image.image_url ? (
                            <img
                              src={image.image_url}
                              alt={plant?.common_name || plant?.scientific_name || 'Plant image'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="flex items-center justify-center h-full text-muted-foreground">
                                      <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <ImageIcon className="h-8 w-8" />
                            </div>
                          )}
                          {image.is_main_image && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              Main
                            </div>
                          )}
                          {hasHealthData && (
                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
                              {getHealthStatusIcon(image.health_status)}
                              <span className="font-medium">
                                {image.health_status?.toUpperCase() || 'UNKNOWN'}
                              </span>
                              {image.health_score !== null && image.health_score !== undefined && (
                                <span className="text-muted-foreground">
                                  ({image.health_score})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          {hasHealthData && assessment && (
                            <div className="pb-2 border-b space-y-1">
                              {assessment.issues_detected && assessment.issues_detected.length > 0 && (
                                <div className="text-xs">
                                  <span className="font-semibold text-orange-600">Issues: </span>
                                  <span className="text-muted-foreground">
                                    {assessment.issues_detected.map((i: any) => i.issue).join(', ')}
                                  </span>
                                </div>
                              )}
                              {assessment.recommended_actions && assessment.recommended_actions.length > 0 && (
                                <div className="text-xs">
                                  <span className="font-semibold text-blue-600">Actions: </span>
                                  <span className="text-muted-foreground">
                                    {assessment.recommended_actions.slice(0, 2).map((a: any) => a.action).join('; ')}
                                    {assessment.recommended_actions.length > 2 && '...'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(image.uploaded_at)}</span>
                            </div>
                            {image.uploaded_by && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{image.uploaded_by}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

