import { DataGrid } from '@/components/DataGrid';

export function StatisticsPage() {
  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Data Grid
        </h1>
        <p className="text-muted-foreground">
          View and browse plant data from the loaded Excel file
        </p>
      </div>
      <DataGrid />
    </div>
  );
}

