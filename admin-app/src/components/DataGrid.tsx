import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  getPlantsFromDatabase, 
  getDomesFromDatabase, 
  type DatabasePlantsResponse, 
  type DatabaseDomesResponse 
} from '@/lib/api';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 50;

export function DataGrid() {
  const { settings } = useSettings();
  const [domes, setDomes] = useState<string[]>([]);
  const [selectedDome, setSelectedDome] = useState<string>('');
  const [plants, setPlants] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadDomes();
  }, [settings.apiBaseUrl]);

  useEffect(() => {
    loadPlants();
  }, [selectedDome, currentPage, settings.apiBaseUrl]);

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
      const response: DatabasePlantsResponse = await getPlantsFromDatabase(
        selectedDome || null,
        ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
        settings.apiBaseUrl
      );
      if (response.success) {
        setPlants(response.plants);
        setTotal(response.total);
        
        // Extract column names from first plant if available, excluding 'id'
        if (response.plants.length > 0) {
          const allColumns = Object.keys(response.plants[0]);
          setColumns(allColumns.filter(col => col !== 'id'));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plants from database');
    } finally {
      setIsLoadingPlants(false);
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

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
          <Button onClick={loadDomes} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dome Selector */}
        <div className="flex items-center gap-4">
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
          <div className="text-sm text-muted-foreground">
            Showing {plants.length} of {total} plants
            {selectedDome && ` in ${selectedDome}`}
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
        ) : plants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No plants found in this dome.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-sm font-medium text-muted-foreground border-b"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plants.map((plant, idx) => (
                    <tr
                      key={idx}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      {columns.map((column) => (
                        <td
                          key={column}
                          className="px-4 py-2 text-sm"
                        >
                          {plant[column] !== null && plant[column] !== undefined
                            ? String(plant[column])
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
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

