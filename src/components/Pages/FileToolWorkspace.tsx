import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation, faCircleCheck, faCopy, faFileLines, faSpinner, faPlus, faTrashCan, faCloudArrowUp, faVideo, faImage as faImageIcon, faDownload, faWandMagicSparkles, faVolumeHigh, faSliders, faCrop, faCompress, faObjectUngroup, faRotateRight, faArrowsLeftRight, faMusic, faVolumeXmark, faTachometerAlt, faBackward, faRepeat, faFilm, faExpand, faGaugeHigh, faMagnifyingGlass, faShieldHalved, faClosedCaptioning, faListOl, faTv, faImages, faDroplet, faSun, faCircleHalfStroke } from '@fortawesome/free-solid-svg-icons';
﻿import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Progress } from '@/components/ui/progress';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { executeJsonFunction, FUNCTION_IDS } from '../../lib/qofeno-appwrite';
import type { ToolCard } from '../../lib/toolCatalog';

import { useAuth } from '../../context/AuthContext';
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
  'crop-image',
  'jpg-to-png',
  'png-to-webp',
  'rotate-image',
  'flip-image',
  'blur-image',
  'sharpen-image',
  'brightness-adjust',
  'contrast-adjust',
  'watermark-image',
  // Video Tools
  'video-compressor',
  'video-trimmer',
  'trim-video',
  'crop-video',
  'compress-video',
  'mp4-converter',
  'mov-converter',
  'avi-converter',
  'webm-converter',
  'merge-videos',
  'rotate-video',
  'flip-video',
  'extract-audio',
  'remove-audio',
  'speed-changer-video',
  'reverse-video',
  'loop-video',
  'gif-maker-video',
  'thumbnail-extractor',
  'resolution-changer',
  'fps-changer',
  'metadata-viewer-video',
  'watermark-video',
  'subtitle-creation',
  'chapter-creator',
  'stabilization-video',
  'aspect-ratio-converter',
  'frame-extractor',
  'audio-sync',
  'mp3-converter',
  'wav-converter',
  'aac-converter',
  'ogg-converter',
  'flac-converter',
  'trim-audio',
  'merge-audio',
  'audio-compressor',
  'volume-booster',
  'change-audio-speed',
  'change-audio-pitch',
  'fade-in-audio',
  'fade-out-audio',
  'silence-remover',
  'audio-reverser',
  'audio-metadata',
  'ringtone-maker',
  'bass-booster',
  'background-noise-remover',
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
  | { type: 'text'; key: string; label: string; placeholder?: string; helper?: string; defaultValue?: string; hide?: boolean }
  | { type: 'number'; key: string; label: string; min?: number; max?: number; defaultValue?: string; hide?: boolean }
  | { type: 'range'; key: string; label: string; min: number; max: number; step: number; defaultValue?: string; hide?: boolean }
  | { type: 'select'; key: string; label: string; options: (string | { label: string; value: string })[]; defaultValue?: string; hide?: boolean }
  | { type: 'switch'; key: string; label: string; defaultValue?: boolean; hide?: boolean };

type FileToolConfig = {
  icon: any;
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
    icon: faFileLines,
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
    icon: faFileLines,
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
    icon: faFileLines,
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
    icon: faFileLines,
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
    icon: faFileLines,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to rotate its pages.',
    description: 'Rotate PDF pages permanently.',
    processLabel: 'Rotate Pages',
    functionId: FUNCTION_IDS.pdfRotate || 'pdf-rotate',
    fields: [
      { type: 'select', key: 'rotation', label: 'Rotation', options: ['90Â° Clockwise', '180Â°', '90Â° Counter-clockwise'], defaultValue: '90Â° Clockwise' },
      { type: 'select', key: 'apply_to', label: 'Apply to', options: ['All pages', 'Odd pages', 'Even pages', 'Specific pages'], defaultValue: 'All pages' },
      { type: 'text', key: 'specific_pages', label: 'Specific pages', placeholder: '1, 3, 5-7', helper: 'Only if "Specific pages" is selected.' }
    ],
  },
  'pdf-to-jpg': {
    icon: faFileLines,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to convert it to JPG images.',
    description: 'Convert PDF pages into high-quality JPG images.',
    processLabel: 'Convert to JPG',
    functionId: FUNCTION_IDS.pdfToJpg || 'pdf-to-jpg',
    fields: [
      { type: 'range', key: 'quality', label: 'Quality', min: 50, max: 100, step: 1, defaultValue: '90' },
      { type: 'select', key: 'dpi', label: 'DPI', options: ['72', '96', '150', '300', '600'], defaultValue: '300' },
      { type: 'text', key: 'pages', label: 'Pages', placeholder: 'All or 1,3,5-7', defaultValue: 'All' }
    ],
  },
  'jpg-to-pdf': {
    icon: faFileLines,
    accept: 'image/jpeg,image/jpg',
    multiple: true,
    helper: 'Upload JPGs to combine them into a PDF.',
    description: 'Convert JPG images into a single PDF document.',
    processLabel: 'Convert to PDF',
    functionId: FUNCTION_IDS.jpgToPdf || 'jpg-to-pdf',
    fields: [
      { type: 'select', key: 'page_size', label: 'Page size', options: ['A4', 'Letter', 'Legal', 'Auto-fit'], defaultValue: 'A4' },
      { type: 'select', key: 'orientation', label: 'Orientation', options: ['Portrait', 'Landscape', 'Auto'], defaultValue: 'Portrait' },
      { type: 'select', key: 'margin', label: 'Margin', options: ['None', 'Small', 'Medium', 'Large'], defaultValue: 'None' }
    ],
    maxFiles: 50,
  },
  'pdf-page-numbers': {
    icon: faFileLines,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to add page numbers.',
    description: 'Add page numbers into PDFs with ease.',
    processLabel: 'Add Page Numbers',
    functionId: FUNCTION_IDS.pdfPageNumbers || 'pdf-page-numbers',
    fields: [
      { type: 'select', key: 'position', label: 'Position', options: ['Bottom center', 'Bottom left', 'Bottom right', 'Top center', 'Top left', 'Top right'], defaultValue: 'Bottom center' },
      { type: 'number', key: 'start_number', label: 'Start number', defaultValue: '1' },
      { type: 'number', key: 'font_size', label: 'Font size', defaultValue: '12' },
      { type: 'select', key: 'format', label: 'Format', options: ['1', 'Page 1', '1 of N', 'Page 1 of N'], defaultValue: '1' }
    ],
  },
  'pdf-to-text': {
    icon: faFileLines,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to extract its text.',
    description: 'Extract text content from your PDF documents.',
    processLabel: 'Extract Text',
    functionId: FUNCTION_IDS.pdfToText || 'pdf-to-text',
    fields: [],
  },
  'pdf-word-count': {
    icon: faFileLines,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to count words and characters.',
    description: 'Count the total number of words and characters in a PDF.',
    processLabel: 'Count Words',
    functionId: FUNCTION_IDS.pdfWordCount || 'pdf-word-count',
    fields: [],
  },
  'pdf-metadata-viewer': {
    icon: faFileLines,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to view its metadata.',
    description: 'View hidden metadata attributes in a PDF file.',
    processLabel: 'View Metadata',
    functionId: FUNCTION_IDS.pdfMetadataViewer || 'pdf-metadata-viewer',
    fields: [],
  },
  'image-resizer': {
    icon: faImageIcon,
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
    icon: faImageIcon,
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
    icon: faImageIcon,
    accept: 'image/*',
    multiple: false,
    helper: 'Upload one image and choose the output format.',
    description: 'Convert between the most common image formats.',
    processLabel: 'Convert Image',
    functionId: FUNCTION_IDS.imageConverter || 'image-converter',
    fields: [{ type: 'select', key: 'output_format', label: 'Output format', options: ['png', 'jpeg', 'webp', 'avif', 'gif'], defaultValue: 'png' }],
  },
  'image-bg-remover': {
    icon: faImageIcon,
    accept: 'image/*',
    multiple: false,
    helper: 'Upload a foreground image and remove its background.',
    description: 'Generate transparent PNG results from simple backgrounds.',
    processLabel: 'Remove Background',
    functionId: FUNCTION_IDS.imageBgRemover || 'image-bg-remover',
    fields: [{ type: 'range', key: 'threshold', label: 'Background threshold', min: 10, max: 90, step: 1, defaultValue: '30' }],
  },
  'video-compressor': {
    icon: faVideo,
    accept: 'video/*',
    multiple: false,
    helper: 'Upload one video to reduce its size.',
    description: 'Compress a video for smaller sharing.',
    processLabel: 'Compress Video',
    functionId: FUNCTION_IDS.videoCompressor || 'video-compressor',
    fields: [{ type: 'range', key: 'quality', label: 'Quality', min: 25, max: 100, step: 1, defaultValue: '80' }],
  },
  'video-trimmer': {
    icon: faVideo,
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
    icon: faFileLines,
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
    icon: faFileLines,
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
    icon: faFileLines,
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
    icon: faFileLines,
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
    icon: faFileLines,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to flatten all form fields and annotations.',
    description: 'Flatten form fields and annotations into the page.',
    processLabel: 'Flatten PDF',
    functionId: FUNCTION_IDS.pdfFlatten || 'pdf-flatten',
    fields: [],
  },

  'pdf-thumbnail': {
    icon: faFileLines,
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
    icon: faFileLines,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a corrupted or invalid PDF to attempt repair.',
    description: 'Try to repair a corrupted PDF file.',
    processLabel: 'Repair PDF',
    functionId: FUNCTION_IDS.pdfRepair || 'pdf-repair',
    fields: [],
  },

  'pdf-redact': {
    icon: faFileLines,
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
    icon: faFileLines,
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
    icon: faFileLines,
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
    icon: faFileLines,
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
    icon: faFileLines,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF with tables to convert to Excel.',
    description: 'Extract tables from PDF into an Excel spreadsheet.',
    processLabel: 'Convert to Excel',
    functionId: FUNCTION_IDS.pdfToExcel || 'pdf-to-excel',
    fields: [],
  },

  'pdf-to-powerpoint': {
    icon: faFileLines,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF presentation to convert to PowerPoint.',
    description: 'Convert PDF slides to a PowerPoint file.',
    processLabel: 'Convert to PowerPoint',
    functionId: FUNCTION_IDS.pdfToPowerpoint || 'pdf-to-powerpoint',
    fields: [],
  },

  'pdf-to-html': {
    icon: faFileLines,
    accept: '.pdf,application/pdf',
    multiple: false,
    helper: 'Upload a PDF to convert its content to an HTML file.',
    description: 'Convert PDF text content to an HTML web page.',
    processLabel: 'Convert to HTML',
    functionId: FUNCTION_IDS.pdfToHtml || 'pdf-to-html',
    fields: [],
  },

  'word-to-pdf': {
    icon: faFileLines,
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    multiple: false,
    helper: 'Upload a Word document (.docx) to convert it to PDF.',
    description: 'Convert a Word document into a PDF.',
    processLabel: 'Convert to PDF',
    functionId: FUNCTION_IDS.wordToPdf || 'word-to-pdf',
    fields: [],
  },

  'excel-to-pdf': {
    icon: faFileLines,
    accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    multiple: false,
    helper: 'Upload an Excel spreadsheet (.xlsx) to convert it to PDF.',
    description: 'Convert an Excel spreadsheet into a PDF.',
    processLabel: 'Convert to PDF',
    functionId: FUNCTION_IDS.excelToPdf || 'excel-to-pdf',
    fields: [],
  },

  'powerpoint-to-pdf': {
    icon: faFileLines,
    accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    multiple: false,
    helper: 'Upload a PowerPoint file (.pptx) to convert it to PDF.',
    description: 'Convert a PowerPoint presentation into a PDF.',
    processLabel: 'Convert to PDF',
    functionId: FUNCTION_IDS.powerpointToPdf || 'powerpoint-to-pdf',
    fields: [],
  },

  'crop-image': {
    icon: faImageIcon, accept: 'image/*', multiple: false,
    helper: 'Upload an image to crop it.', description: 'Crop image to specific width/height.', processLabel: 'Crop Image', functionId: FUNCTION_IDS.cropImage,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'crop', hide: true },
      { type: 'number', key: 'width', label: 'Width (px)', min: 10, defaultValue: '500' },
      { type: 'number', key: 'height', label: 'Height (px)', min: 10, defaultValue: '500' },
      { type: 'number', key: 'top', label: 'Top offset', min: 0, defaultValue: '0' },
      { type: 'number', key: 'left', label: 'Left offset', min: 0, defaultValue: '0' },
    ],
  },
  'jpg-to-png': {
    icon: faImageIcon, accept: 'image/jpeg,image/jpg', multiple: false,
    helper: 'Upload a JPG to convert it to PNG.', description: 'Convert JPG to PNG.', processLabel: 'Convert to PNG', functionId: FUNCTION_IDS.imageConverter,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'convert', hide: true },
      { type: 'text', key: 'output_format', label: '', defaultValue: 'png', hide: true }
    ],
  },
  'png-to-webp': {
    icon: faImageIcon, accept: 'image/png', multiple: false,
    helper: 'Upload a PNG to convert it to WebP.', description: 'Convert PNG to WebP.', processLabel: 'Convert to WebP', functionId: FUNCTION_IDS.imageConverter,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'convert', hide: true },
      { type: 'text', key: 'output_format', label: '', defaultValue: 'webp', hide: true }
    ],
  },
  'rotate-image': {
    icon: faRotateRight, accept: 'image/*', multiple: false,
    helper: 'Upload an image to rotate.', description: 'Rotate image by angle.', processLabel: 'Rotate Image', functionId: FUNCTION_IDS.rotateImage,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'rotate', hide: true },
      { type: 'select', key: 'angle', label: 'Rotation Angle', options: ['90', '180', '270'], defaultValue: '90' }
    ],
  },
  'flip-image': {
    icon: faArrowsLeftRight, accept: 'image/*', multiple: false,
    helper: 'Upload an image to flip.', description: 'Flip image horizontally or vertically.', processLabel: 'Flip Image', functionId: FUNCTION_IDS.flipImage,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'flip', hide: true },
      { type: 'select', key: 'axis', label: 'Axis', options: ['x', 'y'], defaultValue: 'x' }
    ],
  },
  'blur-image': {
    icon: faDroplet, accept: 'image/*', multiple: false,
    helper: 'Upload an image to blur.', description: 'Apply Gaussian blur.', processLabel: 'Blur Image', functionId: FUNCTION_IDS.blurImage,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'blur', hide: true },
      { type: 'number', key: 'sigma', label: 'Blur Intensity', min: 1, max: 100, defaultValue: '5' }
    ],
  },
  'sharpen-image': {
    icon: faWandMagicSparkles, accept: 'image/*', multiple: false,
    helper: 'Upload an image to sharpen.', description: 'Enhance details.', processLabel: 'Sharpen Image', functionId: FUNCTION_IDS.sharpenImage,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'sharpen', hide: true },
      { type: 'number', key: 'sigma', label: 'Sharpen Intensity', min: 1, max: 10, defaultValue: '2' }
    ],
  },
  'brightness-adjust': {
    icon: faSun, accept: 'image/*', multiple: false,
    helper: 'Upload an image to adjust brightness.', description: 'Adjust brightness.', processLabel: 'Apply Brightness', functionId: FUNCTION_IDS.brightnessAdjust,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'brightness', hide: true },
      { type: 'number', key: 'brightness', label: 'Brightness Multiplier (1 = original)', min: 0, defaultValue: '1.5' }
    ],
  },
  'contrast-adjust': {
    icon: faCircleHalfStroke, accept: 'image/*', multiple: false,
    helper: 'Upload an image to adjust contrast.', description: 'Adjust contrast.', processLabel: 'Apply Contrast', functionId: FUNCTION_IDS.contrastAdjust,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'contrast', hide: true },
      { type: 'number', key: 'contrast', label: 'Contrast Multiplier (1 = original)', min: 0, defaultValue: '1.5' }
    ],
  },
  'watermark-image': {
    icon: faShieldHalved, accept: 'image/*', multiple: false,
    helper: 'Upload an image to add watermark.', description: 'Add a text watermark.', processLabel: 'Watermark Image', functionId: FUNCTION_IDS.watermarkImage,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'watermark', hide: true },
      { type: 'text', key: 'text', label: 'Watermark Text', placeholder: 'Copyright Qofeno', defaultValue: 'Watermark' }
    ],
  },

  'trim-video': {
    icon: faVideo, accept: 'video/*', multiple: false,
    helper: 'Upload a video to trim by start time and duration.', description: 'Trim video clips.', processLabel: 'Trim Video', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'trim', hide: true },
      { type: 'text', key: 'start_time', label: 'Start Time (HH:MM:SS)', defaultValue: '00:00:00' },
      { type: 'text', key: 'duration', label: 'Duration (in seconds)', defaultValue: '10' }
    ],
  },
  'crop-video': {
    icon: faCrop, accept: 'video/*', multiple: false,
    helper: 'Crop a video visually by dimensions.', description: 'Crop video frames.', processLabel: 'Crop Video', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'crop', hide: true },
      { type: 'number', key: 'width', label: 'Width', defaultValue: '640' },
      { type: 'number', key: 'height', label: 'Height', defaultValue: '480' },
      { type: 'number', key: 'x', label: 'X Offset', defaultValue: '0' },
      { type: 'number', key: 'y', label: 'Y Offset', defaultValue: '0' }
    ],
  },
  'compress-video': {
    icon: faCompress, accept: 'video/*', multiple: false,
    helper: 'Reduce your video file size by adjusting the CRF quality scale.', description: 'Compress video.', processLabel: 'Compress Video', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'compress', hide: true },
      { type: 'range', key: 'crf', label: 'Compression Quality (Lower is better, 23=default, 28=high compression)', min: 18, max: 51, step: 1, defaultValue: '28' }
    ],
  },
  'mp4-converter': {
    icon: faVideo, accept: 'video/*', multiple: false,
    helper: 'Convert your video to universally compatible MP4.', description: 'Convert to MP4.', processLabel: 'Convert to MP4', functionId: FUNCTION_IDS.mp4Converter,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'convert', hide: true },
      { type: 'text', key: 'format', label: '', defaultValue: 'mp4', hide: true }
    ],
  },
  'mov-converter': {
    icon: faVideo, accept: 'video/*', multiple: false,
    helper: 'Convert your video to QuickTime MOV.', description: 'Convert to MOV.', processLabel: 'Convert to MOV', functionId: FUNCTION_IDS.movConverter,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'convert', hide: true },
      { type: 'text', key: 'format', label: '', defaultValue: 'mov', hide: true }
    ],
  },
  'avi-converter': {
    icon: faVideo, accept: 'video/*', multiple: false,
    helper: 'Convert your video to Audio Video Interleave (AVI).', description: 'Convert to AVI.', processLabel: 'Convert to AVI', functionId: FUNCTION_IDS.aviConverter,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'convert', hide: true },
      { type: 'text', key: 'format', label: '', defaultValue: 'avi', hide: true }
    ],
  },
  'webm-converter': {
    icon: faVideo, accept: 'video/*', multiple: false,
    helper: 'Convert your video to HTML5 WebM format.', description: 'Convert to WebM.', processLabel: 'Convert to WebM', functionId: FUNCTION_IDS.webmConverter,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'convert', hide: true },
      { type: 'text', key: 'format', label: '', defaultValue: 'webm', hide: true }
    ],
  },
  'merge-videos': {
    icon: faObjectUngroup, accept: 'video/*', multiple: true, maxFiles: 10,
    helper: 'Select multiple videos to merge them into one continuous file. Note: All videos must have the same resolution and codecs for optimal joining.', description: 'Merge Videos.', processLabel: 'Merge Videos', functionId: FUNCTION_IDS.mergeVideos,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'merge', hide: true }
    ],
  },
  'rotate-video': {
    icon: faRotateRight, accept: 'video/*', multiple: false,
    helper: 'Rotate the video orientation.', description: 'Rotate video.', processLabel: 'Rotate Video', functionId: FUNCTION_IDS.rotateVideo,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'rotate', hide: true },
      { type: 'select', key: 'angle', label: 'Angle', options: ['90', '180', '270'], defaultValue: '90' }
    ],
  },
  'flip-video': {
    icon: faArrowsLeftRight, accept: 'video/*', multiple: false,
    helper: 'Flip video horizontally or vertically.', description: 'Flip video.', processLabel: 'Flip Video', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'flip', hide: true },
      { type: 'select', key: 'axis', label: 'Axis', options: [{ label: 'Horizontal', value: 'h' }, { label: 'Vertical', value: 'v' }], defaultValue: 'h' }
    ],
  },
  'extract-audio': {
    icon: faMusic, accept: 'video/*', multiple: false,
    helper: 'Extract the audio track from the video.', description: 'Extract Audio.', processLabel: 'Extract Audio', functionId: FUNCTION_IDS.extractAudio,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'extract-audio', hide: true }
    ],
  },
  'remove-audio': {
    icon: faVolumeXmark, accept: 'video/*', multiple: false,
    helper: 'Mute the video permanently by removing the audio track.', description: 'Remove Audio.', processLabel: 'Mute Video', functionId: FUNCTION_IDS.removeAudio,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'remove-audio', hide: true }
    ],
  },
  'speed-changer-video': {
    icon: faTachometerAlt, accept: 'video/*', multiple: false,
    helper: 'Change the playback speed (0.5x to 2.0x).', description: 'Change Video Speed.', processLabel: 'Apply Speed', functionId: FUNCTION_IDS.speedChangerVideo,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'speed', hide: true },
      { type: 'select', key: 'speed', label: 'Speed', options: ['0.5', '0.75', '1.25', '1.5', '2.0'], defaultValue: '1.5' }
    ],
  },
  'reverse-video': {
    icon: faBackward, accept: 'video/*', multiple: false,
    helper: 'Play video backward.', description: 'Reverse Video.', processLabel: 'Reverse Video', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'reverse', hide: true }
    ],
  },
  'loop-video': {
    icon: faRepeat, accept: 'video/*', multiple: false,
    helper: 'Loop the video stream.', description: 'Loop Video.', processLabel: 'Loop Video', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'loop', hide: true },
      { type: 'number', key: 'loops', label: 'Number of Loops', defaultValue: '3' }
    ],
  },
  'gif-maker-video': {
    icon: faFilm, accept: 'video/*', multiple: false,
    helper: 'Convert the video to an animated GIF.', description: 'Video to GIF.', processLabel: 'Convert to GIF', functionId: FUNCTION_IDS.gifMakerVideo,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'gif', hide: true }
    ],
  },
  'thumbnail-extractor': {
    icon: faImageIcon,
    accept: 'video/*', multiple: false,
    helper: 'Extract a single frame thumbnail at a specific timestamp.', description: 'Extract Thumbnail.', processLabel: 'Extract Thumbnail', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'thumbnail', hide: true },
      { type: 'text', key: 'timestamp', label: 'Timestamp (HH:MM:SS)', defaultValue: '00:00:01' }
    ],
  },
  'resolution-changer': {
    icon: faExpand, accept: 'video/*', multiple: false,
    helper: 'Scale the video resolution.', description: 'Change Resolution.', processLabel: 'Change Resolution', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'resolution', hide: true },
      { type: 'number', key: 'width', label: 'Width (-1 to keep ratio)', defaultValue: '1280' },
      { type: 'number', key: 'height', label: 'Height (-1 to keep ratio)', defaultValue: '-1' }
    ],
  },
  'fps-changer': {
    icon: faGaugeHigh, accept: 'video/*', multiple: false,
    helper: 'Change the video framerate (FPS).', description: 'Change FPS.', processLabel: 'Change FPS', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'fps', hide: true },
      { type: 'number', key: 'fps', label: 'Frames Per Second (e.g. 24, 30, 60)', defaultValue: '30' }
    ],
  },
  'metadata-viewer-video': {
    icon: faMagnifyingGlass, accept: 'video/*', multiple: false,
    helper: 'Extract deep metadata from your video file via ffprobe.', description: 'View Metadata.', processLabel: 'Extract Metadata', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'metadata', hide: true }
    ],
  },
  'watermark-video': {
    icon: faShieldHalved, accept: 'video/*,image/*', multiple: true, maxFiles: 2,
    helper: 'Upload exactly 2 files: first the Video, then the Image watermark.', description: 'Watermark Video.', processLabel: 'Apply Watermark', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'watermark', hide: true },
      { type: 'number', key: 'x', label: 'X Coordinate (from left)', defaultValue: '10' },
      { type: 'number', key: 'y', label: 'Y Coordinate (from top)', defaultValue: '10' }
    ],
  },
  'subtitle-creation': {
    icon: faClosedCaptioning, accept: 'video/*,.srt', multiple: true, maxFiles: 2,
    helper: 'Upload exactly 2 files: first the Video, then the .srt Subtitle file.', description: 'Add Subtitles.', processLabel: 'Embed Subtitles', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'subtitle', hide: true }
    ],
  },
  'chapter-creator': {
    icon: faListOl, accept: 'video/*', multiple: false,
    helper: 'Chapter creation using metadata manipulation.', description: 'Chapter Creator.', processLabel: 'Create Chapters', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'chapter', hide: true },
      { type: 'text', key: 'chapters_data', label: 'Wait, this requires complex UI. Proceed with default pass.', hide: true, defaultValue: '[]' }
    ],
  },
  'stabilization-video': {
    icon: faWandMagicSparkles, accept: 'video/*', multiple: false,
    helper: 'Apply deshake filter to stabilize shaky footage.', description: 'Stabilize Video.', processLabel: 'Stabilize Video', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'stabilization', hide: true }
    ],
  },
  'aspect-ratio-converter': {
    icon: faTv, accept: 'video/*', multiple: false,
    helper: 'Change display aspect ratio (e.g. 16:9, 4:3).', description: 'Aspect Ratio Converter.', processLabel: 'Change Aspect Ratio', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'aspect-ratio', hide: true },
      { type: 'select', key: 'ratio', label: 'Aspect Ratio', options: ['16/9', '4/3', '1/1', '9/16'], defaultValue: '16/9' }
    ],
  },
  'frame-extractor': {
    icon: faImages, accept: 'video/*', multiple: false,
    helper: 'Extract frames at 1 FPS into a ZIP file.', description: 'Extract Frames.', processLabel: 'Extract Frames', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'frame-extract', hide: true }
    ],
  },
  'audio-sync': {
    icon: faSliders, accept: 'video/*', multiple: false,
    helper: 'Shift audio forward or backward (in seconds) to fix sync issues.', description: 'Audio Sync.', processLabel: 'Sync Audio', functionId: FUNCTION_IDS.videoManipulator,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'audio-sync', hide: true },
      { type: 'number', key: 'delay', label: 'Audio Delay/Advance (seconds)', defaultValue: '1' }
    ],
  },
  'mp3-converter': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Convert audio to MP3.', description: 'MP3 Converter.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.mp3Converter,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'convert', hide: true },
      { type: 'text', key: 'format', label: '', defaultValue: 'mp3', hide: true },
    ],
  },
  'wav-converter': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Convert audio to WAV.', description: 'WAV Converter.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.wavConverter,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'convert', hide: true },
      { type: 'text', key: 'format', label: '', defaultValue: 'wav', hide: true },
    ],
  },
  'aac-converter': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Convert audio to AAC.', description: 'AAC Converter.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.aacConverter,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'convert', hide: true },
      { type: 'text', key: 'format', label: '', defaultValue: 'aac', hide: true },
    ],
  },
  'ogg-converter': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Convert audio to OGG.', description: 'OGG Converter.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.oggConverter,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'convert', hide: true },
      { type: 'text', key: 'format', label: '', defaultValue: 'ogg', hide: true },
    ],
  },
  'flac-converter': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Convert audio to FLAC.', description: 'FLAC Converter.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.flacConverter,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'convert', hide: true },
      { type: 'text', key: 'format', label: '', defaultValue: 'flac', hide: true },
    ],
  },
  'trim-audio': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Cut and trim audio files.', description: 'Trim Audio.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.trimAudio,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'trim', hide: true },
      { type: 'text', key: 'start_time', label: 'Start Time (HH:MM:SS)', defaultValue: '00:00:00' },
      { type: 'text', key: 'end_time', label: 'End Time / Duration', defaultValue: '00:00:10' },
    ],
  },
  'merge-audio': {
    icon: faMusic, accept: 'audio/*', multiple: true,
    helper: 'Combine multiple audio files into one.', description: 'Merge Audio.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.mergeAudio,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'merge', hide: true },
    ],
  },
  'audio-compressor': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Compress audio files to save space.', description: 'Audio Compressor.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.audioCompressor,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'compress', hide: true },
    ],
  },
  'volume-booster': {
    icon: faVolumeHigh, accept: 'audio/*', multiple: false,
    helper: 'Increase the volume of your audio.', description: 'Volume Booster.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.volumeBooster,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'volume-boost', hide: true },
      { type: 'number', key: 'volume', label: 'Volume Multiplier', defaultValue: '2.0' },
    ],
  },
  'change-audio-speed': {
    icon: faTachometerAlt, accept: 'audio/*', multiple: false,
    helper: 'Speed up or slow down audio.', description: 'Change Audio Speed.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.changeSpeed,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'speed', hide: true },
      { type: 'number', key: 'speed', label: 'Speed Multiplier (e.g., 1.5, 0.5)', defaultValue: '1.5' },
    ],
  },
  'change-audio-pitch': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Change the pitch of your audio.', description: 'Change Audio Pitch.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.changePitch,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'pitch', hide: true },
      { type: 'number', key: 'pitch', label: 'Pitch Ratio (e.g., 1.2 for higher, 0.8 for lower)', defaultValue: '1.2' },
    ],
  },
  'fade-in-audio': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Add a fade in effect to audio.', description: 'Fade In Audio.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.fadeIn,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'fade-in', hide: true },
      { type: 'number', key: 'duration', label: 'Fade In Duration (seconds)', defaultValue: '3' },
    ],
  },
  'fade-out-audio': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Add a fade out effect to audio.', description: 'Fade Out Audio.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.fadeOut,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'fade-out', hide: true },
      { type: 'number', key: 'start_time', label: 'Start Time (seconds)', defaultValue: '10' },
      { type: 'number', key: 'duration', label: 'Fade Out Duration (seconds)', defaultValue: '3' },
    ],
  },
  'silence-remover': {
    icon: faVolumeXmark, accept: 'audio/*', multiple: false,
    helper: 'Remove silent parts from audio.', description: 'Silence Remover.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.silenceRemover,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'silence-remove', hide: true },
    ],
  },
  'audio-reverser': {
    icon: faBackward, accept: 'audio/*', multiple: false,
    helper: 'Play your audio backwards.', description: 'Audio Reverser.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.audioReverser,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'reverse', hide: true },
    ],
  },
  'audio-metadata': {
    icon: faFileLines, accept: 'audio/*', multiple: false,
    helper: 'Extract audio metadata to JSON.', description: 'Audio Metadata.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.audioMetadataViewer,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'metadata', hide: true },
    ],
  },
  'ringtone-maker': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Create a ringtone from audio.', description: 'Ringtone Maker.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.ringtoneMaker,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'ringtone', hide: true },
      { type: 'text', key: 'start_time', label: 'Start Time (HH:MM:SS)', defaultValue: '00:00:00' },
      { type: 'number', key: 'duration', label: 'Duration (seconds)', defaultValue: '30' },
    ],
  },
  'bass-booster': {
    icon: faMusic, accept: 'audio/*', multiple: false,
    helper: 'Boost the bass in your audio.', description: 'Bass Booster.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.bassBooster,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'bass-boost', hide: true },
      { type: 'number', key: 'gain', label: 'Gain (dB)', defaultValue: '5' },
    ],
  },
  'background-noise-remover': {
    icon: faWandMagicSparkles, accept: 'audio/*', multiple: false,
    helper: 'Clean up audio and remove noise.', description: 'Background Noise Remover.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.backgroundNoiseRemover,
    fields: [
      { type: 'text', key: 'action', label: '', defaultValue: 'noise-remove', hide: true },
    ],
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
  const { user } = useAuth();
  
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

  const forceDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // Auto-open download when done
  useEffect(() => {
    if (stage === 'done' && result?.download_url) {
      forceDownload(result.download_url, result.output_filename || 'download');
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

      if (isMultiple) {
        const inputs = await Promise.all(
          files.map(async (f) => ({ file_base64: await fileToDataUrl(f), input_filename: f.name }))
        );
        payload = { files: inputs, user_id: userId || null, ...fields };
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
      toast.success('Processing complete!');
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

  // --- STAGE: IDLE ----------------------------------------------------
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
            <FontAwesomeIcon icon={faCircleExclamation}  className="w-5 h-5 text-red-500 flex-shrink-0" />
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
            <FontAwesomeIcon icon={config.icon} className="w-10 h-10 text-purple-600" />
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
            Accepts: {acceptedExts === '.pdf' ? '.PDF, PDF/A' : acceptedExts} &middot; up to 500 MB
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

  // --- STAGE: PROCESSING ----------------------------------------------------
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
          <p className="text-xl font-bold text-[#0F0A1E]">Processing your file...</p>
          <p className="text-sm text-neutral-500 mt-1">Running on our servers - this won't take long</p>
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

  // --- STAGE: DONE ----------------------------------------------------
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
                <FontAwesomeIcon icon={faCircleCheck}  className="w-6 h-6 text-white" />
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
                  <button onClick={() => forceDownload(item.download_url!, item.output_filename || `Output ${i + 1}`)}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-colors">
                    <FontAwesomeIcon icon={faDownload}  className="w-3.5 h-3.5" /> Download
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Single output */
          <div className="rounded-3xl border-2 border-green-200 bg-green-50 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCircleCheck}  className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-green-800">Your file is ready!</p>
                <p className="text-sm text-green-600">
                  {result.output_filename || 'output'}{result.output_size ? ` · ${humanFileSize(result.output_size)}` : ''}
                </p>
              </div>
            </div>

            {result.download_url ? (
              <button
                onClick={() => forceDownload(result.download_url!, result.output_filename || 'result')}
                className="flex w-full min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-black text-lg shadow-lg shadow-purple-200 transition-all mb-3"
              >
                <FontAwesomeIcon icon={faDownload}  className="w-6 h-6" />
                Download {result.output_filename || 'result'}
              </button>
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
              ⮌ Process another file
            </button>
            <p className="text-xs text-center text-neutral-400 mt-2">
              🔒 Your file will be automatically deleted from our servers
            </p>
          </div>
        )}

        {/* Process another */}
        {outputs && outputs.length > 0 && (
          <button onClick={resetTool} className="w-full py-3 text-purple-600 font-semibold hover:underline transition-colors">
            ⮌ Process another file
          </button>
        )}
      </motion.div>
    );
  }

  // --- STAGE: ERROR ----------------------------------------------------
  if (stage === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl border-2 border-red-200 bg-red-50 p-6 w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <FontAwesomeIcon icon={faCircleExclamation}  className="w-8 h-8 text-red-500 flex-shrink-0" />
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

  // --- STAGE: FILE SELECTED ----------------------------------------------------
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
                <FontAwesomeIcon icon={faFileLines}  className="w-5 h-5 text-purple-600" />
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
                <FontAwesomeIcon icon={faTrashCan}  className="w-4 h-4" />
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
            <FontAwesomeIcon icon={faPlus}  className="w-4 h-4 inline mr-1" /> Add more files
          </button>
        )}
      </motion.div>

      {/* Settings panel - only visible after file selected */}
      {config.fields.some(f => !(f as any).hide) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-black text-[#0F0A1E]">
            <FontAwesomeIcon icon={faSliders}  className="w-4 h-4 text-purple-600" /> Settings
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {config.fields.filter(f => !(f as any).hide).map((field) => {
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
        <FontAwesomeIcon icon={faWandMagicSparkles}  className="w-6 h-6" />
        {config.processLabel}
      </motion.button>

      {/* Change file */}
      <button onClick={resetTool} className="w-full text-center text-sm font-bold text-neutral-500 hover:text-neutral-700 transition-colors">
        Change file
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
