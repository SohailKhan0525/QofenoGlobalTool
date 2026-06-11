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
      { type: 'select', key: 'rotation', label: 'Rotation', options: ['90Â° Clockwise', '180Â°', '90Â° Counter-clockwise'], defaultValue: '90Â° Clockwise' },
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

  // â”€â”€ PRO PDF Tools â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  while (size >= 1024 && index < units.length - 1) { size /= 1024; index++; }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

type Stage = 'idle' | 'file_selected' | 'processing' | 'done' | 'error';

export function FileToolWorkspace({ tool, userId }: { tool: ToolCard; userId?: string | null }) {
  const config = FILE_TOOL_CONFIG[tool.slug as FileToolSlug];
  const inputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FileToolResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, any>>({});
  const [wrongType, setWrongType] = useState(false);

  // Reset when tool changes
  useEffect(() => {
    setStage('idle');
    setFiles([]);
    setResult(null);
    setErrorMsg(null);
    setProgress(0);
    setWrongType(false);
    const cfg = FILE_TOOL_CONFIG[tool.slug as FileToolSlug];
    if (cfg) {
      const defaults: Record<string, any> = {};
      cfg.fields.forEach((field) => {
        if ('defaultValue' in field) defaults[field.key] = field.defaultValue;
        else if (field.type === 'switch') defaults[field.key] = false;
        else defaults[field.key] = '';
      });
      setFields(defaults);
    }
  }, [tool.slug]);

  // Auto-open download when done
  useEffect(() => {
    if (stage === 'done' && result?.download_url) {
      window.open(result.download_url, '_blank', 'noreferrer');
    }
  }, [stage, result]);

  if (!config) return null;

  const acceptText = config.accept;
  const isMultiple = Boolean(config.multiple);
  const acceptedExts = acceptText.split(',').map(s => s.trim().replace('application/', '').replace('image/', '').toUpperCase()).filter(Boolean).join(', ');

  const setField = (key: string, value: any) => setFields((prev) => ({ ...prev, [key]: value }));

  const isFileTypeAccepted = (file: File) => {
    const accepted = acceptText.split(',').map(s => s.trim().toLowerCase());
    const fname = file.name.toLowerCase();
    return accepted.some(a => {
      if (a.startsWith('.')) return fname.endsWith(a);
      if (a.includes('*')) return file.type.startsWith(a.replace('*', ''));
      return file.type === a;
    });
  };

  const pickFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    setWrongType(false);
    const bad = arr.some(f => !isFileTypeAccepted(f));
    if (bad) {
      setWrongType(true);
      return;
    }
    const maxFiles = config.maxFiles || (isMultiple ? 20 : 1);
    setFiles((prev) => {
      const merged = isMultiple ? [...prev, ...arr] : arr.slice(0, 1);
      return merged.slice(0, maxFiles);
    });
    setStage('file_selected');
    setResult(null);
    setErrorMsg(null);
  };

  const resetTool = () => {
    setStage('idle');
    setFiles([]);
    setResult(null);
    setErrorMsg(null);
    setProgress(0);
    setWrongType(false);
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });

  const runTool = async () => {
    if (!config || !files.length) return;
    if (isMultiple && files.length < 2) {
      toast.info('Add at least two files.');
      return;
    }

    setStage('processing');
    setProgress(10);
    setErrorMsg(null);

    const ticker = window.setInterval(() => {
      setProgress((prev) => Math.min(90, prev + 6));
    }, 200);

    try {
      let payload: Record<string, unknown>;

      if (tool.slug === 'pdf-merger') {
        const inputs = await Promise.all(
          files.map(async (f) => ({ file_base64: await fileToDataUrl(f), input_filename: f.name }))
        );
        payload = { files: inputs, user_id: userId || null, output_filename: `qofeno-merged-${Date.now()}.pdf` };
      } else {
        const primary = files[0];
        payload = {
          file_base64: await fileToDataUrl(primary),
          input_filename: primary.name,
          user_id: userId || null,
          ...fields,
        };
      }

      const response = await executeJsonFunction(config.functionId, payload);
      setProgress(100);

      if (response?.success === false) {
        throw new Error(String(response?.error || 'The tool could not finish the task.'));
      }

      // Resolve download URL from file_id if needed
      if (!response.download_url && response.file_id) {
        try {
          const dl = await executeJsonFunction(FUNCTION_IDS.createDownloadLink, { file_id: response.file_id });
          if (dl?.success && dl.download_url) response.download_url = dl.download_url;
        } catch {}
      }

      if (Array.isArray(response.outputs)) {
        for (const item of response.outputs) {
          if (!item.download_url && item.file_id) {
            try {
              const dl = await executeJsonFunction(FUNCTION_IDS.createDownloadLink, { file_id: item.file_id });
              if (dl?.success && dl.download_url) item.download_url = dl.download_url;
            } catch {}
          }
        }
      }

      setResult(response);
      setStage('done');
      toast.success('âœ… Processing complete!');
    } catch (err: any) {
      const message = err?.message || 'Something went wrong while processing the file.';
      setErrorMsg(message);
      setStage('error');
      toast.error(message);
    } finally {
      window.clearInterval(ticker);
      setTimeout(() => setProgress(0), 400);
    }
  };

  // â”€â”€â”€ STAGE: IDLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (stage === 'idle') {
    return (
      <div className="w-full">
        {/* Wrong type error */}
        {wrongType && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Wrong file type</p>
              <p className="text-xs text-red-600 mt-0.5">This tool accepts <strong>{acceptedExts}</strong> files only</p>
            </div>
          </motion.div>
        )}

        {/* Upload zone */}
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pickFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center cursor-pointer select-none',
            'border-2 border-dashed rounded-3xl transition-all duration-200',
            'min-h-[300px] w-full p-8 sm:p-12 text-center',
            dragging
              ? 'border-purple-500 bg-purple-100 scale-[1.01] shadow-xl shadow-purple-200'
              : 'border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-400'
          )}
        >
          <div className="w-20 h-20 mb-5 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto">
            {config.icon === ImageIcon
              ? <ImageIcon className="w-10 h-10 text-purple-600" />
              : config.icon === Video
              ? <Video className="w-10 h-10 text-purple-600" />
              : <FileText className="w-10 h-10 text-purple-600" />
            }
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#0F0A1E] mb-2">
            {isMultiple ? 'Select files' : 'Select a file'}
          </h2>
          <p className="text-neutral-500 text-base mb-6">or drop {isMultiple ? 'files' : 'a file'} here</p>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-base rounded-xl shadow-lg shadow-purple-200 transition-all"
          >
            Select {isMultiple ? 'files' : 'file'}
          </button>

          <p className="text-xs text-neutral-400 mt-5">
            Accepts: {acceptedExts} Â· up to 500 MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={acceptText}
          multiple={isMultiple}
          className="hidden"
          onChange={(e) => { if (e.target.files) pickFiles(e.target.files); e.target.value = ''; }}
        />
      </div>
    );
  }

  // â”€â”€â”€ STAGE: PROCESSING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (stage === 'processing') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 gap-6 w-full"
      >
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 animate-spin" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" stroke="#E9D5FF" strokeWidth="8" fill="none" />
            <circle cx="40" cy="40" r="34" stroke="#7C3AED" strokeWidth="8" fill="none"
              strokeDasharray="213" strokeDashoffset="150" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black text-purple-700">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-[#0F0A1E]">Processing your fileâ€¦</p>
          <p className="text-sm text-neutral-500 mt-1">Running on our servers â€” this won't take long</p>
        </div>
        <div className="w-full max-w-xs bg-neutral-100 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>
    );
  }

  // â”€â”€â”€ STAGE: DONE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (stage === 'done' && result) {
    const outputs = result.outputs;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full space-y-4"
      >
        {/* Multiple outputs (e.g. pdf-splitter) */}
        {outputs && outputs.length > 0 ? (
          <div className="rounded-3xl border-2 border-green-200 bg-green-50 p-6 space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-green-800">Your files are ready!</p>
                <p className="text-sm text-green-600">{outputs.length} files generated</p>
              </div>
            </div>
            {outputs.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-2xl border border-green-200 p-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0F0A1E] truncate">{item.output_filename || `Output ${i + 1}`}</p>
                  {item.output_size ? <p className="text-xs text-neutral-500">{humanFileSize(item.output_size)}</p> : null}
                </div>
                {item.download_url && (
                  <a href={item.download_url} target="_blank" rel="noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Single output */
          <div className="rounded-3xl border-2 border-green-200 bg-green-50 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-green-800">Your file is ready!</p>
                <p className="text-sm text-green-600">
                  {result.output_filename || 'output'}{result.output_size ? ` Â· ${humanFileSize(result.output_size)}` : ''}
                </p>
              </div>
            </div>

            {result.download_url ? (
              <a
                href={result.download_url}
                download={result.output_filename}
                target="_blank"
                rel="noreferrer"
                className="flex w-full min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-black text-lg shadow-lg shadow-purple-200 transition-all mb-3"
              >
                <Download className="w-6 h-6" />
                Download {result.output_filename || 'result'}
              </a>
            ) : (
              /* Text-only results (pdf-to-text, pdf-word-count, pdf-metadata-viewer) */
              <div className="rounded-2xl bg-white border border-green-200 p-4 mb-3">
                <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-mono overflow-auto max-h-64">
                  {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
                </pre>
              </div>
            )}

            <button
              onClick={resetTool}
              className="w-full py-3 text-purple-600 font-semibold hover:text-purple-800 transition-colors hover:underline"
            >
              â†© Process another file
            </button>
            <p className="text-xs text-center text-neutral-400 mt-2">
              ðŸ”’ Your file will be automatically deleted from our servers
            </p>
          </div>
        )}

        {/* Process another */}
        {outputs && outputs.length > 0 && (
          <button onClick={resetTool} className="w-full py-3 text-purple-600 font-semibold hover:underline transition-colors">
            â†© Process another file
          </button>
        )}
      </motion.div>
    );
  }

  // â”€â”€â”€ STAGE: ERROR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (stage === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl border-2 border-red-200 bg-red-50 p-6 w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-black text-red-800 text-lg">Processing failed</p>
            <p className="text-sm text-red-600 mt-0.5">{errorMsg}</p>
          </div>
        </div>
        <button
          onClick={resetTool}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
        >
          Try again
        </button>
      </motion.div>
    );
  }

  // â”€â”€â”€ STAGE: FILE SELECTED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="w-full space-y-4">
      {/* Selected file(s) info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-2"
      >
        <AnimatePresence mode="popLayout">
          {files.map((file, i) => (
            <motion.div
              key={`${file.name}-${i}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#0F0A1E] truncate text-sm">{file.name}</p>
                <p className="text-xs text-neutral-500">{humanFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => {
                  const next = files.filter((_, j) => j !== i);
                  if (next.length === 0) setStage('idle');
                  setFiles(next);
                }}
                className="p-2 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add more files (for multi-file tools) */}
        {isMultiple && (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all"
          >
            <Plus className="w-4 h-4 inline mr-1" /> Add more files
          </button>
        )}
      </motion.div>

      {/* Settings panel â€” only visible after file selected */}
      {config.fields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-black text-[#0F0A1E]">
            <SlidersHorizontal className="w-4 h-4 text-purple-600" /> Settings
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {config.fields.map((field) => {
              if (field.type === 'select') {
                return (
                  <label key={field.key} className="space-y-1.5 text-sm font-semibold text-neutral-700">
                    <span>{field.label}</span>
                    <select
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-purple-500"
                      value={fields[field.key] ?? field.defaultValue ?? ''}
                      onChange={(e) => setField(field.key, e.target.value)}
                    >
                      {field.options.map((opt) => {
                        const val = typeof opt === 'string' ? opt : opt.value;
                        const lbl = typeof opt === 'string' ? opt : opt.label;
                        return <option key={val} value={val}>{lbl}</option>;
                      })}
                    </select>
                  </label>
                );
              }
              if (field.type === 'range') {
                const val = fields[field.key] ?? field.defaultValue ?? String(field.max);
                return (
                  <label key={field.key} className="space-y-1.5 text-sm font-semibold text-neutral-700">
                    <div className="flex items-center justify-between">
                      <span>{field.label}</span>
                      <span className="text-xs text-neutral-500">{val}</span>
                    </div>
                    <input
                      type="range" min={field.min} max={field.max} step={field.step}
                      value={val}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="w-full accent-purple-600"
                    />
                  </label>
                );
              }
              if (field.type === 'switch') {
                const checked = Boolean(fields[field.key] ?? field.defaultValue ?? false);
                return (
                  <label key={field.key} className="flex items-center justify-between text-sm font-semibold text-neutral-700 cursor-pointer py-1">
                    <span>{field.label}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setField(field.key, String(e.target.checked))}
                      className="w-4 h-4 accent-purple-600"
                    />
                  </label>
                );
              }
              // text / number
              return (
                <label key={field.key} className="space-y-1.5 text-sm font-semibold text-neutral-700">
                  <span>{field.label}</span>
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    placeholder={(field as any).placeholder}
                    min={field.type === 'number' ? field.min : undefined}
                    max={field.type === 'number' ? field.max : undefined}
                    value={fields[field.key] ?? field.defaultValue ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-purple-500"
                    style={{ fontSize: '16px' }}
                  />
                  {(field as any).helper && <p className="text-xs text-neutral-500">{(field as any).helper}</p>}
                </label>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Big Process Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        onClick={runTool}
        className="w-full min-h-[60px] flex items-center justify-center gap-3
          bg-gradient-to-r from-purple-600 to-fuchsia-600
          hover:from-purple-700 hover:to-fuchsia-700
          active:scale-[0.98] text-white font-black text-xl
          rounded-2xl shadow-xl shadow-purple-200 transition-all"
      >
        <Sparkles className="w-6 h-6" />
        {config.processLabel}
      </motion.button>

      {/* Change file */}
      <button onClick={resetTool} className="w-full text-center text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
        â†© Choose a different file
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={acceptText}
        multiple={isMultiple}
        className="hidden"
        onChange={(e) => { if (e.target.files) pickFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}
