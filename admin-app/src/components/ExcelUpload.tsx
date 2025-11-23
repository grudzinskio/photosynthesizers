import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { uploadExcelFile, type ExcelUploadResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';

export function ExcelUpload() {
  const { settings } = useSettings();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ExcelUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fileName = droppedFile.name.toLowerCase();
      const isValidExcel = 
        fileName.endsWith('.xlsx') || 
        fileName.endsWith('.xls') ||
        droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        droppedFile.type === 'application/vnd.ms-excel';
      
      if (isValidExcel) {
        setFile(droppedFile);
        setError(null);
        setUploadResult(null);
      } else {
        setError('Please drop a valid Excel file (.xlsx or .xls)');
      }
    } else {
      setError('No file detected. Please drop a valid Excel file (.xlsx or .xls)');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      const isValidExcel = 
        fileName.endsWith('.xlsx') || 
        fileName.endsWith('.xls') ||
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel';
      
      if (isValidExcel) {
        setFile(selectedFile);
        setError(null);
        setUploadResult(null);
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        // Reset the input
        e.target.value = '';
      }
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await uploadExcelFile(file, settings.apiBaseUrl);
      setUploadResult(result);
      if (!result.success) {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setFile(null);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSelectFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel File Upload
          </CardTitle>
          <CardDescription>
            Upload an Excel file containing plant collection data. Supported formats: .xlsx, .xls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              file && "border-primary/50 bg-primary/5"
            )}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <FileSpreadsheet className="h-8 w-8" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="min-w-32"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload File
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isUploading}
                  >
                    Change File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    Drag and drop your Excel file here
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    or click the button below to browse
                  </p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSelectFileClick}
                  >
                    <Upload className="h-4 w-4" />
                    Select File
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Result */}
          {uploadResult?.success && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Upload Successful!</AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                <p>{uploadResult.message}</p>
                {uploadResult.total_plants !== undefined && (
                  <p className="font-medium">
                    Total Plants: {uploadResult.total_plants.toLocaleString()}
                  </p>
                )}
                {uploadResult.dome_counts && Object.keys(uploadResult.dome_counts).length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium mb-2">Plants by Dome:</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(uploadResult.dome_counts).map(([dome, count]) => (
                        <div
                          key={dome}
                          className="flex justify-between items-center p-2 bg-background rounded border"
                        >
                          <span className="text-sm">{dome}</span>
                          <span className="text-sm font-medium">{count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {uploadResult.domes && uploadResult.domes.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium mb-2">Available Domes:</p>
                    <div className="flex flex-wrap gap-2">
                      {uploadResult.domes.map((dome) => (
                        <span
                          key={dome}
                          className="px-2 py-1 text-xs bg-primary/10 text-primary rounded border border-primary/20"
                        >
                          {dome}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

