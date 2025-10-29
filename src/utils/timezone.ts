import { Timezone } from '../types/transaction';

export const adjustTimezone = (dateString: string | null, timezone: Timezone): Date | null => {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  // Handle different date formats that might be in the CSV
  let date: Date;
  
  // Try parsing as-is first
  date = new Date(dateString);
  
  // If invalid, try parsing with different formats
  if (isNaN(date.getTime())) {
    // Try parsing as YYYY-MM-DD HH:mm:ss format
    const cleanedDate = dateString.replace(/[^\d\-\s:]/g, '');
    date = new Date(cleanedDate);
  }
  
  // If still invalid, try parsing just the date part
  if (isNaN(date.getTime())) {
    const datePart = dateString.split(' ')[0];
    date = new Date(datePart);
  }

  if (isNaN(date.getTime())) {
    return null;
  }

  if (timezone === 'GMT+6') {
    date.setHours(date.getHours() + 6);
  }

  return date;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatDateTime = (date: Date): string => {
  return date.toISOString().replace('T', ' ').substring(0, 19);
};