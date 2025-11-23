// Helper function to format column names
export function formatColumnName(column: string): string {
  return column
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to format date/time
export function formatDateTime(dateValue: unknown): string {
  if (!dateValue) return '-';
  
  try {
    const date = new Date(String(dateValue));
    if (isNaN(date.getTime())) return String(dateValue);
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(dateValue);
  }
}

// Helper function to format boolean values
export function formatBoolean(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  const str = String(value).toLowerCase();
  if (str === 'true' || str === 'yes') return 'Yes';
  if (str === 'false' || str === 'no') return 'No';
  return String(value);
}

// Helper function to check if value is boolean
export function isBooleanValue(value: unknown): boolean {
  return typeof value === 'boolean' || 
         String(value).toLowerCase() === 'true' || 
         String(value).toLowerCase() === 'false';
}

// Helper to extract number from qty string (e.g., "6+", "10", "5")
function extractNumber(str: string): number | null {
  const cleaned = str.replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Helper for qty sorting - convert to numbers when possible
export function compareQtyValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
  const aStr = a !== null && a !== undefined ? String(a) : '';
  const bStr = b !== null && b !== undefined ? String(b) : '';
  
  // Try to extract numbers
  const aNum = extractNumber(aStr);
  const bNum = extractNumber(bStr);
  
  // Both are numbers
  if (aNum !== null && bNum !== null) {
    const diff = direction === 'asc' ? aNum - bNum : bNum - aNum;
    return diff === 0 ? aStr.localeCompare(bStr) : diff;
  }
  
  // Only a is a number - numbers come first in asc, last in desc
  if (aNum !== null && bNum === null) {
    return direction === 'asc' ? -1 : 1;
  }
  
  // Only b is a number
  if (aNum === null && bNum !== null) {
    return direction === 'asc' ? 1 : -1;
  }
  
  // Neither is a number - sort as strings
  return direction === 'asc' 
    ? aStr.localeCompare(bStr)
    : bStr.localeCompare(aStr);
}

// LocalStorage utilities for column filters
const FILTERS_STORAGE_KEY = 'dataGrid_columnFilters';

export function loadColumnFilters(): Record<string, string> {
  try {
    const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

export function saveColumnFilters(filters: Record<string, string>): void {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Ignore storage errors
  }
}

