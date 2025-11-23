import { ExcelUpload } from '@/components/ExcelUpload';

export function SettingsPage() {
  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Upload and manage plant collection data from Excel files
        </p>
      </div>
      <ExcelUpload />
    </div>
  );
}

