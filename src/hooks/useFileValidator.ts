import { useMemo } from 'react';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function useFileValidator(
  tool: {
    accepted_extensions?: string[];
    max_file_size_free?: number;
    max_file_size_pro?: number;
  },
  isPaidUser: boolean = false
) {
  const maxSize = useMemo(() => {
    if (isPaidUser) {
      return tool.max_file_size_pro || 524288000; // 500MB
    }
    return tool.max_file_size_free || 52428800; // 50MB
  }, [tool.max_file_size_pro, tool.max_file_size_free, isPaidUser]);

  const validate = (file: File): ValidationResult => {
    if (!file) {
      return { valid: false, error: 'No file selected.' };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File is too large (${formatBytes(file.size)}). Maximum limit is ${formatBytes(maxSize)}.${
          !isPaidUser ? ' Upgrade to Pro for 500MB limit.' : ''
        }`
      };
    }

    if (tool.accepted_extensions && tool.accepted_extensions.length > 0) {
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      const normalizedAllowed = tool.accepted_extensions.map(e => e.toLowerCase().startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`);
      
      if (!normalizedAllowed.includes(ext)) {
        return {
          valid: false,
          error: `Invalid file type "${ext}". Supported types: ${normalizedAllowed.join(', ')}`
        };
      }
    }

    return { valid: true };
  };

  return { validate, maxSize, maxSizeFormatted: formatBytes(maxSize) };
}
