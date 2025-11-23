import { useState, useEffect } from 'react';
import { BarChart3, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getExcelStatistics, type ExcelStatisticsResponse } from '@/lib/api';
import { useSettings } from '@/contexts/SettingsContext';

export function StatisticsDisplay() {
  const { settings } = useSettings();
  const [statistics, setStatistics] = useState<ExcelStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stats = await getExcelStatistics(settings.apiBaseUrl);
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.apiBaseUrl]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistics
          </CardTitle>
          <CardDescription>
            Current statistics for loaded Excel data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistics
          </CardTitle>
          <CardDescription>
            Current statistics for loaded Excel data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchStatistics} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!statistics?.is_loaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistics
          </CardTitle>
          <CardDescription>
            Current statistics for loaded Excel data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No Excel file loaded.</p>
            <p className="text-sm mt-2">Upload a file to see statistics.</p>
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
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistics
            </CardTitle>
            <CardDescription>
              Current statistics for loaded Excel data
            </CardDescription>
          </div>
          <Button onClick={fetchStatistics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {statistics.message && (
          <p className="text-sm text-muted-foreground">{statistics.message}</p>
        )}

        {statistics.total_plants !== undefined && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Total Plants</div>
            <div className="text-3xl font-bold">{statistics.total_plants.toLocaleString()}</div>
          </div>
        )}

        {statistics.domes && Object.keys(statistics.domes).length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Plants by Dome</h3>
            <div className="space-y-2">
              {Object.entries(statistics.domes).map(([dome, data]) => {
                const count = typeof data === 'object' && data !== null && 'count' in data
                  ? data.count
                  : null;
                return (
                  <div
                    key={dome}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="font-medium">{dome}</span>
                    {count !== null && count !== undefined ? (
                      <span className="text-lg font-semibold">{count.toLocaleString()}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No count available</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(!statistics.domes || Object.keys(statistics.domes).length === 0) && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No dome data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

