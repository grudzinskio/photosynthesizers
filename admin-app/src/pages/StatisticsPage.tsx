import { DataGrid } from '@/components/DataGrid';

export function StatisticsPage() {
  return (
    <div className="flex-1 p-8">
      <div className="mb-4">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Plants
        </h1>
      </div>
      <DataGrid />
    </div>
  );
}

