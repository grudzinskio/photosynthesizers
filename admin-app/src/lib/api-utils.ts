/**
 * Utility functions for API calls
 */

/**
 * Handles API response errors consistently
 */
export async function handleApiResponse<T>(response: Response, defaultError: string): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: defaultError }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Creates a fetch request with consistent error handling
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  defaultError: string
): Promise<T> {
  // Only set Content-Type for JSON requests (not FormData)
  const headers: HeadersInit = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  return handleApiResponse<T>(response, defaultError);
}

