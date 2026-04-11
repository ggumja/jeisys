import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString || dateString === '') return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error('Error formatting date:', e, 'Input:', dateString);
    return '-';
  }
}

export function formatWithCommas(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  const stringValue = value.toString().replace(/,/g, '');
  if (isNaN(Number(stringValue))) return stringValue;
  return Number(stringValue).toLocaleString('ko-KR');
}

export function unformatNumber(value: string): number {
  if (!value) return 0;
  return Number(value.replace(/,/g, '')) || 0;
}
