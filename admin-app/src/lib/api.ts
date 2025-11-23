// API base URL will be provided by SettingsContext
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8004';
}

export interface ExcelUploadResponse {
  success: boolean;
  message?: string;
  error?: string;
  dome_counts?: Record<string, number>;
  total_plants?: number;
  domes?: string[];
}

export interface ExcelStatisticsResponse {
  is_loaded: boolean;
  message?: string;
  domes?: Record<string, {
    count?: number;
    [key: string]: unknown;
  }>;
  total_plants?: number;
}

export async function uploadExcelFile(file: File, apiBaseUrl?: string): Promise<ExcelUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const baseUrl = apiBaseUrl || getApiBaseUrl();

  const response = await fetch(`${baseUrl}/api/excel/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to upload file' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getExcelStatistics(apiBaseUrl?: string): Promise<ExcelStatisticsResponse> {
  const baseUrl = apiBaseUrl || getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/excel/statistics`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get statistics' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export interface PlantsResponse {
  success: boolean;
  dome: string;
  plants: Record<string, unknown>[];
  count: number;
  total: number;
  limit: number;
  offset: number;
}

export async function getPlantsByDome(
  domeName: string,
  limit: number = 100,
  offset: number = 0,
  apiBaseUrl?: string
): Promise<PlantsResponse> {
  const baseUrl = apiBaseUrl || getApiBaseUrl();
  const response = await fetch(
    `${baseUrl}/api/excel/plants/${encodeURIComponent(domeName)}?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get plants' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export interface DomesResponse {
  success: boolean;
  domes: string[];
  count: number;
}

export async function getAvailableDomes(apiBaseUrl?: string): Promise<DomesResponse> {
  const baseUrl = apiBaseUrl || getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/excel/domes`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get domes' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Database routes (fetch from Supabase, not from in-memory Excel data)
export interface DatabasePlantsResponse {
  success: boolean;
  plants: Record<string, unknown>[];
  count: number;
  total: number;
  limit: number;
  offset: number;
  dome?: string | null;
}

export async function getPlantsFromDatabase(
  dome?: string | null,
  limit: number = 100,
  offset: number = 0,
  apiBaseUrl?: string
): Promise<DatabasePlantsResponse> {
  const baseUrl = apiBaseUrl || getApiBaseUrl();
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (dome) {
    params.append('dome', dome);
  }
  
  const response = await fetch(`${baseUrl}/api/excel/database/plants?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get plants from database' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export interface DatabaseDomesResponse {
  success: boolean;
  domes: string[];
  count: number;
}

export async function getDomesFromDatabase(apiBaseUrl?: string): Promise<DatabaseDomesResponse> {
  const baseUrl = apiBaseUrl || getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/excel/database/domes`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get domes from database' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Image routes
export interface RecentImagesResponse {
  success: boolean;
  images: Array<{
    id: string;
    plant_id: string;
    image_url: string;
    uploaded_by?: string;
    uploaded_at: string;
    is_main_image: boolean;
    metadata?: Record<string, unknown>;
    created_at: string;
    plants?: {
      id: string;
      common_name?: string;
      scientific_name: string;
      dome: string;
      [key: string]: unknown;
    };
  }>;
  count: number;
}

export async function getRecentImages(
  limit: number = 50,
  apiBaseUrl?: string
): Promise<RecentImagesResponse> {
  const baseUrl = apiBaseUrl || getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/images/recent?limit=${limit}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get recent images' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export interface PlantImagesResponse {
  success: boolean;
  plant_id: string;
  images: RecentImagesResponse['images'];
  count: number;
}

export async function getImagesByPlantId(
  plantId: string,
  apiBaseUrl?: string
): Promise<PlantImagesResponse> {
  const baseUrl = apiBaseUrl || getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/images/plant/${encodeURIComponent(plantId)}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get images for plant' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

