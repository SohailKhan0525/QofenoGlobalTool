import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText,
  Image as ImageIcon,
  Loader2,
  LucideIcon,
  Plus,
  Trash2,
  UploadCloud,
  Video,
  Download,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { executeJsonFunction, FUNCTION_IDS } from '../../lib/qofeno-appwrite';
import type { ToolCard } from '../../lib/toolCatalog';

export const FILE_TOOL_SLUGS = new Set([
  // FREE PDF Tools
  'pdf-compressor',
  'pdf-merger',
  'pdf-splitter',
  'pdf-rotate',
  'pdf-to-jpg',
  'jpg-to-pdf',
  'pdf-page-numbers',
  'pdf-to-text',
  'pdf-word-count',
  'pdf-metadata-viewer',
  // PRO PDF Tools
  'pdf-to-word',
  'pdf-watermark',
  'pdf-protect',
  'pdf-ocr',
  'pdf-unlock',
  'pdf-flatten',
  'pdf-thumbnail',
  'pdf-repair',
  'pdf-redact',
  'pdf-sign',
  'pdf-crop',
  'pdf-compare',
  'pdf-to-excel',
  'pdf-to-powerpoint',
  'pdf-to-html',
  'word-to-pdf',
  'excel-to-pdf',
  'powerpoint-to-pdf',
  // Image Tools
  'image-resizer',
  'image-compressor',
  'image-converter',
  'image-bg-remover',
  // Video Tools
  'video-compressor',
  'video-trimmer',
]);

type FileToolSlug = typeof FILE_TOOL_SLUGS extends Set<infer T> ? T : string;

type FileToolResult = {
  success?: boolean;
  download_url?: string;
  output_filename?: string;
  output_size?: number;
  duration_ms?: number;
  outputs?: Array<{
    download_url?: string;
    output_filename?: string;
    output_size?: number;
    page_start?: number;
    page_end?: number;
    file_id?: string;
  }>;
  error?: string;
};

type FileToolField =
  | { type: 'text'; key: string; label: string; placeholder?: string; helper?: string; defaultValue?: string }
  | { type: 'select'; key: string; label: string; options: (string | { label: string; value: string })[]; defaultValue?: string }
  | { type: 'range'; key: string; label: string; min: number; max: number; step: number; defaultValue?: string }
  | { type: 'switch'; key: string; label: string; defaultValue?: boolean }
  | { type: 'number'; key: string; label: string; min?: number; max?: number; defaultValue?: string };

type FileToolConfig = {
  icon: LucideIcon;
  accept: string;
  multiple: boolean;
  helper: string;
  description: string;
  processLabel: string;
  functionId: string;
  fields: FileToolField[];
  maxFiles?: number;
};

const FILE_TOOL_CONFIG: Record<string, FileToolConfig> = {
  'pdf-compressor': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Drop a PDF or pick one from your device.',
    description: 'Compress a PDF without leaving the current page.',
    processLabel: 'Compress PDF',
    functionId: FUNCTION_IDS.pdfCompressor || 'pdf-compressor',
    fields: [
      { type: 'select', key: 'compression_level', label: 'Compression Level', options: ['Low', 'Medium', 'High', 'Maximum'], defaultValue: 'Medium' }
    ],
  },
  'pdf-merger': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: true,
    helper: 'Select multiple PDFs to merge them into one document.',
    description: 'Merge several PDFs into a single file.',
    processLabel: 'Merge PDFs',
    functionId: FUNCTION_IDS.pdfMerger || 'pdf-merger',
    fields: [
      { type: 'text', key: 'output_filename', label: 'Output Filename', defaultValue: 'merged.pdf' }
    ],
    maxFiles: 20,
  },
  'pdf-splitter': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload one PDF, then define page ranges like 1-2, 4, 7-10.',
    description: 'Split a PDF into smaller page ranges.',
    processLabel: 'Split PDF',
    functionId: FUNCTION_IDS.pdfSplitter || 'pdf-splitter',
    fields: [
      { type: 'select', key: 'split_mode', label: 'Split Mode', options: ['By page ranges', 'Every N pages', 'By bookmarks'], defaultValue: 'By page ranges' },
      { type: 'text', key: 'page_ranges', label: 'Page ranges / N pages', placeholder: '1-3, 5, 7-9', helper: 'For ranges use 1-3,5. For N pages enter a number.' }
    ],
  },
  'pdf-to-word': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload one PDF to extract its text into a Word-ready output.',
    description: 'Convert a PDF into editable text output.',
    processLabel: 'Convert to Word',
    functionId: FUNCTION_IDS.pdfToWord || 'pdf-to-word',
    fields: [
      { type: 'select', key: 'conversion_mode', label: 'Conversion mode', options: ['Standard', 'OCR mode'], defaultValue: 'Standard' },
      { type: 'switch', key: 'preserve_layout', label: 'Preserve layout', defaultValue: true }
    ],
  },
  'pdf-rotate': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to rotate its pages.',
    description: 'Rotate PDF pages permanently.',
    processLabel: 'Rotate Pages',
    functionId: 'pdf-rotate',
    fields: [
      { type: 'select', key: 'rotation', label: 'Rotation', options: ['90° Clockwise', '180°', '90° Counter-clockwise'], defaultValue: '90° Clockwise' },
      { type: 'select', key: 'apply_to', label: 'Apply to', options: ['All pages', 'Odd pages', 'Even pages', 'Specific pages'], defaultValue: 'All pages' },
      { type: 'text', key: 'specific_pages', label: 'Specific pages', placeholder: '1, 3, 5-7', helper: 'Only if "Specific pages" is selected.' }
    ],
  },
  'pdf-to-jpg': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to convert it to JPG images.',
    description: 'Convert PDF pages into high-quality JPG images.',
    processLabel: 'Convert to JPG',
    functionId: 'pdf-to-jpg',
    fields: [
      { type: 'range', key: 'quality', label: 'Quality', min: 50, max: 100, step: 1, defaultValue: '90' },
      { type: 'select', key: 'dpi', label: 'DPI', options: ['72', '96', '150', '300', '600'], defaultValue: '300' },
      { type: 'text', key: 'pages', label: 'Pages', placeholder: 'All or 1,3,5-7', defaultValue: 'All' }
    ],
  },
  'jpg-to-pdf': {
    icon: FileText,
    accept: 'image/jpeg,image/jpg',
    multiple: true,
    helper: 'Upload JPGs to combine them into a PDF.',
    description: 'Convert JPG images into a single PDF document.',
    processLabel: 'Convert to PDF',
    functionId: 'jpg-to-pdf',
    fields: [
      { type: 'select', key: 'page_size', label: 'Page size', options: ['A4', 'Letter', 'Legal', 'Auto-fit'], defaultValue: 'A4' },
      { type: 'select', key: 'orientation', label: 'Orientation', options: ['Portrait', 'Landscape', 'Auto'], defaultValue: 'Portrait' },
      { type: 'select', key: 'margin', label: 'Margin', options: ['None', 'Small', 'Medium', 'Large'], defaultValue: 'None' }
    ],
    maxFiles: 50,
  },
  'pdf-page-numbers': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to add page numbers.',
    description: 'Add page numbers into PDFs with ease.',
    processLabel: 'Add Page Numbers',
    functionId: 'pdf-page-numbers',
    fields: [
      { type: 'select', key: 'position', label: 'Position', options: ['Bottom center', 'Bottom left', 'Bottom right', 'Top center', 'Top left', 'Top right'], defaultValue: 'Bottom center' },
      { type: 'number', key: 'start_number', label: 'Start number', defaultValue: '1' },
      { type: 'number', key: 'font_size', label: 'Font size', defaultValue: '12' },
      { type: 'select', key: 'format', label: 'Format', options: ['1', 'Page 1', '1 of N', 'Page 1 of N'], defaultValue: '1' }
    ],
  },
  'pdf-to-text': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to extract its text.',
    description: 'Extract text content from your PDF documents.',
    processLabel: 'Extract Text',
    functionId: 'pdf-to-text',
    fields: [],
  },
  'pdf-word-count': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to count words and characters.',
    description: 'Count the total number of words and characters in a PDF.',
    processLabel: 'Count Words',
    functionId: 'pdf-word-count',
    fields: [],
  },
  'pdf-metadata-viewer': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to view its metadata.',
    description: 'View hidden metadata attributes in a PDF file.',
    processLabel: 'View Metadata',
    functionId: 'pdf-metadata-viewer',
    fields: [],
  },
  'image-resizer': {
    icon: ImageIcon,
    accept: 'image/*',
    multiple: false,
    helper: 'Upload one image and resize it for your target layout.',
    description: 'Resize images with mobile-friendly controls.',
    processLabel: 'Resize Image',
    functionId: FUNCTION_IDS.imageResizer || 'image-resizer',
    fields: [
      { type: 'text', key: 'width', label: 'Width', placeholder: '1024' },
      { type: 'text', key: 'height', label: 'Height', placeholder: '768' },
      { type: 'select', key: 'output_format', label: 'Output format', options: ['webp', 'png', 'jpeg', 'avif'], defaultValue: 'webp' },
      { type: 'range', key: 'quality', label: 'Quality', min: 35, max: 100, step: 1, defaultValue: '80' },
    ],
  },
  'image-compressor': {
    icon: ImageIcon,
    accept: 'image/*',
    multiple: false,
    helper: 'Upload one image to reduce its file size.',
    description: 'Compress a single image with output-format controls.',
    processLabel: 'Compress Image',
    functionId: FUNCTION_IDS.imageCompressor || 'image-compressor',
    fields: [
      { type: 'select', key: 'output_format', label: 'Output format', options: ['jpeg', 'webp', 'avif', 'png'], defaultValue: 'jpeg' },
      { type: 'range', key: 'quality', label: 'Quality', min: 35, max: 100, step: 1, defaultValue: '80' },
    ],
  },
  'image-converter': {
    icon: ImageIcon,
    accept: 'image/*',
    multiple: false,
    helper: 'Upload one image and choose the output format.',
    description: 'Convert between the most common image formats.',
    processLabel: 'Convert Image',
    functionId: FUNCTION_IDS.imageConverter || 'image-converter',
    fields: [{ type: 'select', key: 'output_format', label: 'Output format', options: ['png', 'jpeg', 'webp', 'avif', 'gif'], defaultValue: 'png' }],
  },
  'image-bg-remover': {
    icon: ImageIcon,
    accept: 'image/*',
    multiple: false,
    helper: 'Upload a foreground image and remove its background.',
    description: 'Generate transparent PNG results from simple backgrounds.',
    processLabel: 'Remove Background',
    functionId: FUNCTION_IDS.imageBgRemover || 'image-bg-remover',
    fields: [{ type: 'range', key: 'threshold', label: 'Background threshold', min: 10, max: 90, step: 1, defaultValue: '30' }],
  },
  'video-compressor': {
    icon: Video,
    accept: 'video/*',
    multiple: false,
    helper: 'Upload one video to reduce its size.',
    description: 'Compress a video for smaller sharing.',
    processLabel: 'Compress Video',
    functionId: FUNCTION_IDS.videoCompressor || 'video-compressor',
    fields: [{ type: 'range', key: 'quality', label: 'Quality', min: 25, max: 100, step: 1, defaultValue: '80' }],
  },
  'video-trimmer': {
    icon: Video,
    accept: 'video/*',
    multiple: false,
    helper: 'Upload one video and trim it by start and end times.',
    description: 'Trim a clip without a timeline editor.',
    processLabel: 'Trim Video',
    functionId: FUNCTION_IDS.videoTrimmer || 'video-trimmer',
    fields: [
      { type: 'text', key: 'start_time', label: 'Start time', placeholder: '0' },
      { type: 'text', key: 'end_time', label: 'End time', placeholder: '30' },
    ],
  },

  // ── PRO PDF Tools ──────────────────────────────────────────────────────────

  'pdf-watermark': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF and add a text watermark to every page.',
    description: 'Add a visible watermark to your PDF.',
    processLabel: 'Add Watermark',
    functionId: FUNCTION_IDS.pdfWatermark || 'pdf-watermark',
    fields: [
      { type: 'text', key: 'watermark_text', label: 'Watermark text', placeholder: 'CONFIDENTIAL', defaultValue: 'CONFIDENTIAL' },
      { type: 'select', key: 'position', label: 'Position', options: ['Center', 'Top-left', 'Top-right', 'Bottom-left', 'Bottom-right'], defaultValue: 'Center' },
      { type: 'range', key: 'opacity', label: 'Opacity', min: 0.05, max: 1, step: 0.05, defaultValue: '0.3' },
      { type: 'number', key: 'font_size', label: 'Font size', min: 24, max: 120, defaultValue: '48' },
      { type: 'range', key: 'rotation', label: 'Rotation (degrees)', min: -90, max: 90, step: 5, defaultValue: '45' },
      { type: 'select', key: 'apply_to', label: 'Apply to', options: ['All pages', 'First page', 'Last page'], defaultValue: 'All pages' },
    ],
  },

  'pdf-protect': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to add password protection.',
    description: 'Password-protect your PDF document.',
    processLabel: 'Protect PDF',
    functionId: FUNCTION_IDS.pdfProtect || 'pdf-protect',
    fields: [
      { type: 'text', key: 'owner_password', label: 'Owner password (required)', placeholder: 'owner-password-123' },
      { type: 'text', key: 'user_password', label: 'User password (optional)', placeholder: 'user-password-123' },
    ],
  },

  'pdf-ocr': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a scanned PDF to make it text-searchable.',
    description: 'OCR: make scanned PDFs searchable.',
    processLabel: 'Run OCR',
    functionId: FUNCTION_IDS.pdfOcr || 'pdf-ocr',
    fields: [
      { type: 'select', key: 'language', label: 'Language', options: ['English', 'Spanish', 'French', 'German', 'Arabic', 'Hindi', 'Auto-detect'], defaultValue: 'English' },
      { type: 'select', key: 'output_type', label: 'Output type', options: ['Searchable PDF', 'Text file (.txt)'], defaultValue: 'Searchable PDF' },
    ],
  },

  'pdf-unlock': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a password-protected PDF to remove its password.',
    description: 'Remove password protection from a PDF.',
    processLabel: 'Unlock PDF',
    functionId: FUNCTION_IDS.pdfUnlock || 'pdf-unlock',
    fields: [
      { type: 'text', key: 'password', label: 'Current password (if known)', placeholder: 'Enter PDF password' },
    ],
  },

  'pdf-flatten': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to flatten all form fields and annotations.',
    description: 'Flatten form fields and annotations into the page.',
    processLabel: 'Flatten PDF',
    functionId: FUNCTION_IDS.pdfFlatten || 'pdf-flatten',
    fields: [],
  },

  'pdf-thumbnail': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to generate a thumbnail of the first page.',
    description: 'Generate a high-quality JPG thumbnail from a PDF.',
    processLabel: 'Generate Thumbnail',
    functionId: FUNCTION_IDS.pdfThumbnail || 'pdf-thumbnail',
    fields: [
      { type: 'select', key: 'dpi', label: 'DPI', options: ['72', '96', '150', '300'], defaultValue: '150' },
      { type: 'number', key: 'page', label: 'Page number', min: 1, defaultValue: '1' },
    ],
  },

  'pdf-repair': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a corrupted or invalid PDF to attempt repair.',
    description: 'Try to repair a corrupted PDF file.',
    processLabel: 'Repair PDF',
    functionId: FUNCTION_IDS.pdfRepair || 'pdf-repair',
    fields: [],
  },

  'pdf-redact': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF and enter text to redact (black out) from all pages.',
    description: 'Permanently black out sensitive text in a PDF.',
    processLabel: 'Redact PDF',
    functionId: FUNCTION_IDS.pdfRedact || 'pdf-redact',
    fields: [
      { type: 'text', key: 'redact_text', label: 'Text to redact', placeholder: 'Social Security, Account No', helper: 'Comma-separated list of phrases to black out.' },
    ],
  },

  'pdf-sign': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to add a signature placeholder or image.',
    description: 'Add a signature image to a PDF page.',
    processLabel: 'Sign PDF',
    functionId: FUNCTION_IDS.pdfSign || 'pdf-sign',
    fields: [
      { type: 'select', key: 'position', label: 'Signature position', options: ['Bottom-right', 'Bottom-left', 'Bottom-center', 'Top-right'], defaultValue: 'Bottom-right' },
      { type: 'number', key: 'page', label: 'Page number', min: 1, defaultValue: '1' },
    ],
  },

  'pdf-crop': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to crop its page dimensions.',
    description: 'Crop or resize the page dimensions of a PDF.',
    processLabel: 'Crop PDF',
    functionId: FUNCTION_IDS.pdfCrop || 'pdf-crop',
    fields: [
      { type: 'number', key: 'margin_top', label: 'Margin top (pt)', min: 0, defaultValue: '36' },
      { type: 'number', key: 'margin_bottom', label: 'Margin bottom (pt)', min: 0, defaultValue: '36' },
      { type: 'number', key: 'margin_left', label: 'Margin left (pt)', min: 0, defaultValue: '36' },
      { type: 'number', key: 'margin_right', label: 'Margin right (pt)', min: 0, defaultValue: '36' },
    ],
  },

  'pdf-compare': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: true,
    helper: 'Upload exactly two PDFs to compare their content.',
    description: 'Compare two PDFs and highlight differences.',
    processLabel: 'Compare PDFs',
    functionId: FUNCTION_IDS.pdfCompare || 'pdf-compare',
    maxFiles: 2,
    fields: [
      { type: 'select', key: 'compare_mode', label: 'Compare mode', options: ['Text only', 'Both'], defaultValue: 'Text only' },
    ],
  },

  'pdf-to-excel': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF with tables to convert to Excel.',
    description: 'Extract tables from PDF into an Excel spreadsheet.',
    processLabel: 'Convert to Excel',
    functionId: FUNCTION_IDS.pdfToExcel || 'pdf-to-excel',
    fields: [],
  },

  'pdf-to-powerpoint': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF presentation to convert to PowerPoint.',
    description: 'Convert PDF slides to a PowerPoint file.',
    processLabel: 'Convert to PowerPoint',
    functionId: FUNCTION_IDS.pdfToPowerpoint || 'pdf-to-powerpoint',
    fields: [],
  },

  'pdf-to-html': {
    icon: FileText,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to convert its content to an HTML file.',
    description: 'Convert PDF text content to an HTML web page.',
    processLabel: 'Convert to HTML',
    functionId: FUNCTION_IDS.pdfToHtml || 'pdf-to-html',
    fields: [],
  },

  'word-to-pdf': {
    icon: FileText,
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    multiple: false,
    helper: 'Upload a Word document (.docx) to convert it to PDF.',
    description: 'Convert a Word document into a PDF.',
    processLabel: 'Convert to PDF',
    functionId: FUNCTION_IDS.wordToPdf || 'word-to-pdf',
    fields: [],
  },

  'excel-to-pdf': {
    icon: FileText,
    accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    multiple: false,
    helper: 'Upload an Excel spreadsheet (.xlsx) to convert it to PDF.',
    description: 'Convert an Excel spreadsheet into a PDF.',
    processLabel: 'Convert to PDF',
    functionId: FUNCTION_IDS.excelToPdf || 'excel-to-pdf',
    fields: [],
  },

  'powerpoint-to-pdf': {
    icon: FileText,
    accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    multiple: false,
    helper: 'Upload a PowerPoint file (.pptx) to convert it to PDF.',
    description: 'Convert a PowerPoint presentation into a PDF.',
    processLabel: 'Convert to PDF',
    functionId: FUNCTION_IDS.powerpointToPdf || 'powerpoint-to-pdf',
    fields: [],
  },
};

function humanFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let index = 0;
  let size = bytes;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the selected file'));
    reader.readAsDataURL(file);
  });
}

function base64ToText(input: string) {
  try {
    return atob(input);
  } catch {
    return '';
  }
}

export function FileToolWorkspace({ tool, userId }: { tool: ToolCard; userId?: string | null }) {
  const config = FILE_TOOL_CONFIG[tool.slug as FileToolSlug];
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FileToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, any>>({});

  useEffect(() => {
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
    setProcessing(false);
    
    // Initialize default values for fields
    const config = FILE_TOOL_CONFIG[tool.slug as FileToolSlug];
    if (config) {
      const defaultFields: Record<string, any> = {};
      config.fields.forEach(field => {
        if ('defaultValue' in field) {
          defaultFields[field.key] = field.defaultValue;
        } else if (field.type === 'switch') {
          defaultFields[field.key] = false;
        } else {
          defaultFields[field.key] = '';
        }
      });
      setFields(defaultFields);
    }
  }, [tool.slug]);

  const acceptText = config?.accept || 'application/octet-stream';
  const isMultiple = Boolean(config?.multiple);

  const canProcess = useMemo(() => {
    if (!config) return false;
    if (!files.length) return false;
    if (isMultiple) return files.length >= 2;
    return true;
  }, [config, files.length, isMultiple]);

  const setField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const pickFiles = (incoming: FileList | File[]) => {
    const next = Array.from(incoming);
    const maxFiles = config?.maxFiles || (isMultiple ? 8 : 1);
    setError(null);
    setResult(null);
    setFiles((prev) => {
      const merged = isMultiple ? [...prev, ...next] : next.slice(0, 1);
      return merged.slice(0, maxFiles);
    });
  };

  const readPayload = async () => {
    const primary = files[0];
    if (!primary) {
      throw new Error('Add a file first');
    }

    if (tool.slug === 'pdf-merger') {
      const inputs = await Promise.all(files.map(async (file) => ({
        file_base64: await fileToDataUrl(file),
        input_filename: file.name,
      })));
      return {
        files: inputs,
        user_id: userId || null,
        output_filename: `qofeno-${tool.slug}-${Date.now()}.pdf`,
      };
    }

    const basePayload: Record<string, unknown> = {
      file_base64: await fileToDataUrl(primary),
      input_filename: primary.name,
      user_id: userId || null,
    };

    return {
      ...basePayload,
      ...fields, // Inject all dynamic fields to payload
    };
  };

  const runTool = async () => {
    if (!config) return;
    if (!canProcess) {
      toast.info(isMultiple ? 'Add at least two files.' : 'Add a file first.');
      return;
    }

    setProcessing(true);
    setProgress(15);
    setError(null);
    setResult(null);
    const ticker = window.setInterval(() => {
      setProgress((prev) => Math.min(92, prev + 8));
    }, 180);

    try {
      const payload = await readPayload();
      const response = await executeJsonFunction(config.functionId, payload);
      setProgress(100);
      if (response?.success === false) {
        throw new Error(String(response?.error || 'The tool could not finish the task.'));
      }

      // If the function returned only a file_id (no download URL), request a signed link.
      try {
        if (!response.download_url && response.file_id) {
          const dl = await executeJsonFunction(FUNCTION_IDS.createDownloadLink, { file_id: response.file_id });
          if (dl && dl.success && dl.download_url) response.download_url = dl.download_url;
        }

        if (Array.isArray(response.outputs)) {
          for (let i = 0; i < response.outputs.length; i += 1) {
            const item = response.outputs[i];
            if (!item.download_url && item.file_id) {
              try {
                const dl = await executeJsonFunction(FUNCTION_IDS.createDownloadLink, { file_id: item.file_id });
                if (dl && dl.success && dl.download_url) item.download_url = dl.download_url;
              } catch {}
            }
          }
        }
      } catch (err) {
        // Non-fatal: continue with partial results
      }

      setResult(response);
      toast.success('Processing complete');
    } catch (err: any) {
      const message = err?.message || 'Something went wrong while processing the file.';
      setError(message);
      toast.error(message);
    } finally {
      window.clearInterval(ticker);
      window.setTimeout(() => {
        setProgress(0);
        setProcessing(false);
      }, 350);
    }
  };

  const copyLink = async (link?: string) => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success('Copied download link');
  };

  if (!config) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative rounded-3xl border border-dashed border-purple-200 bg-purple-50/60 p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#d8b4fe_2px,transparent_2px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
          <div
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              pickFiles(event.dataTransfer.files);
            }}
            className={cn(
              'rounded-2xl border-2 border-dashed p-6 sm:p-8 transition-all',
              dragging ? 'border-purple-500 bg-white shadow-lg' : 'border-purple-200 bg-white/80'
            )}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
                <UploadCloud className="w-7 h-7 text-purple-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#0F0A1E]">{config.description}</h3>
                <p className="text-sm text-neutral-500 max-w-md">{config.helper}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                <span className="rounded-full bg-neutral-100 px-3 py-1">{isMultiple ? 'Multiple files' : 'Single file'}</span>
                <span className="rounded-full bg-neutral-100 px-3 py-1">{acceptText}</span>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-md">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-neutral-200 px-4 py-3 text-sm font-bold text-[#0F0A1E] transition-colors hover:bg-neutral-50"
                >
                  <Plus className="w-4 h-4" /> Select files
                </button>
                <button
                  onClick={runTool}
                  disabled={!canProcess || processing}
                  className="inline-flex w-full min-h-[56px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-purple-500/20 transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-purple-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {processing ? 'Processing on our servers...' : config.processLabel}
                </button>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={acceptText}
                multiple={isMultiple}
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) pickFiles(event.target.files);
                }}
              />
            </div>
          </div>
        </div>

        {config.fields.length > 0 && (
          <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-[#0F0A1E]">
              <SlidersHorizontal className="w-4 h-4 text-purple-600" /> Settings
            </div>
            <div className="grid gap-3">
              {config.fields.map((field) => {
                if (field.type === 'select') {
                  return (
                    <label key={field.key} className="space-y-2 text-sm font-semibold text-neutral-700">
                      <span>{field.label}</span>
                      <select
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition-colors focus:border-purple-500"
                        value={fields[field.key] ?? field.defaultValue ?? ''}
                        onChange={(event) => setField(field.key, event.target.value)}
                      >
                        {field.options.map((option) => {
                          const val = typeof option === 'string' ? option : option.value;
                          const lbl = typeof option === 'string' ? option : option.label;
                          return <option key={val} value={val}>{lbl}</option>;
                        })}
                      </select>
                    </label>
                  );
                }

                if (field.type === 'range') {
                  const value = fields[field.key] ?? field.defaultValue ?? String(field.max);
                  return (
                    <label key={field.key} className="space-y-2 text-sm font-semibold text-neutral-700">
                      <div className="flex items-center justify-between">
                        <span>{field.label}</span>
                        <span className="text-xs text-neutral-500">{value}</span>
                      </div>
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={value}
                        onChange={(event) => setField(field.key, event.target.value)}
                        className="w-full accent-purple-600"
                      />
                    </label>
                  );
                }

                if (field.type === 'switch') {
                  const value = fields[field.key] ?? field.defaultValue ?? false;
                  return (
                    <label key={field.key} className="flex items-center justify-between text-sm font-semibold text-neutral-700 cursor-pointer">
                      <span>{field.label}</span>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(event) => setField(field.key, String(event.target.checked))}
                        className="w-4 h-4 accent-purple-600"
                      />
                    </label>
                  );
                }

                return (
                  <label key={field.key} className="space-y-2 text-sm font-semibold text-neutral-700">
                    <span>{field.label}</span>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      placeholder={(field as any).placeholder}
                      min={field.type === 'number' ? field.min : undefined}
                      max={field.type === 'number' ? field.max : undefined}
                      value={fields[field.key] ?? field.defaultValue ?? ''}
                      onChange={(event) => setField(field.key, event.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition-colors focus:border-purple-500"
                    />
                    {(field as any).helper ? <p className="text-xs text-neutral-500">{(field as any).helper}</p> : null}
                  </label>
                );
              })}
            </div>
            {files.length > 0 && (
              <button
                onClick={() => setFiles([])}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:bg-neutral-200"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear files
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-[#0F0A1E]">Selected files</h4>
              <p className="text-xs text-neutral-500">{files.length ? `${files.length} file(s) ready` : 'No files selected yet'}</p>
            </div>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">{humanFileSize(files.reduce((sum, file) => sum + file.size, 0))}</span>
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {files.length ? (
                files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#0F0A1E]">{file.name}</p>
                      <p className="text-xs text-neutral-500">{humanFileSize(file.size)} · {file.type || 'unknown type'}</p>
                    </div>
                    <button
                      onClick={() => setFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
                      className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-white hover:text-neutral-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
                  Add files to preview them here.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-[#0F0A1E]">Result</h4>
              <p className="text-xs text-neutral-500">Download or copy the returned link once processing finishes.</p>
            </div>
            {processing && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
          </div>

          {progress > 0 && (
            <div className="mb-4 space-y-2">
              <Progress value={progress} className="h-2 bg-neutral-100 [&>div]:bg-purple-600" />
              <p className="text-xs font-semibold text-neutral-500">Working on your file… {Math.round(progress)}%</p>
            </div>
          )}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="mb-1 flex items-center gap-2 font-bold"><AlertCircle className="w-4 h-4" /> Processing failed</div>
              <p>{error}</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {result.outputs?.length ? (
                <div className="space-y-3">
                  {result.outputs.map((item, index) => (
                    <div key={`${item.output_filename || 'output'}-${index}`} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#0F0A1E]">{item.output_filename || `Output ${index + 1}`}</p>
                          <p className="text-xs text-neutral-500">{item.output_size ? humanFileSize(item.output_size) : 'Ready to download'}</p>
                        </div>
                        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
                          {item.download_url && (
                            <a
                              href={item.download_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex w-full sm:w-auto min-h-[56px] items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-green-700"
                            >
                              <Download className="w-4 h-4" /> Download Result
                            </a>
                          )}
                          <button
                            onClick={() => copyLink(item.download_url)}
                            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 transition-colors hover:bg-neutral-100"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy link
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3 text-sm font-bold text-[#0F0A1E]">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-black">Your file is ready!</p>
                      <p className="mt-1 text-xs text-green-800">{result.output_filename || 'Result file'}{result.output_size ? ` · ${humanFileSize(result.output_size)}` : ''}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    {result.download_url && (
                      <a
                        href={result.download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full min-h-[56px] items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-green-700"
                      >
                        <Download className="w-4 h-4" /> Download Result
                      </a>
                    )}
                    <button
                      onClick={() => { setResult(null); setFiles([]); setError(null); }}
                      className="inline-flex w-full items-center justify-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors py-1"
                    >
                      ↩ Process another file
                    </button>
                    <button
                      onClick={() => copyLink(result.download_url)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 transition-colors hover:bg-neutral-100"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy link
                    </button>
                    <p className="text-[11px] text-neutral-500">🔒 Your file will be deleted from our servers after download</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
              Results will show here after you run the tool.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
