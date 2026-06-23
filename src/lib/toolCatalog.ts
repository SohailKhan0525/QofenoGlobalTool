import { useEffect, useState } from 'react';
import { Query } from 'appwrite';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faFileLines, faFilePdf, faImage as faImageIcon, faVideo, faRobot, faCode,
  faGraduationCap, faChartBar, faPenNib, faDatabase, faFileWord, faFileExcel,
  faFilePowerpoint, faCompress, faScissors, faCut, faRotate, faShield, faLock,
  faUnlock, faMagnifyingGlass, faWater, faListOl, faObjectUngroup, faExpand,
  faDroplet, faTools, faFolder, faCog, faBroom, faCrop, faImage,
  faFileZipper, faKey, faEye, faBolt, faPen, faEyeSlash, faStar,
  faLayerGroup, faCompressArrowsAlt, faColumns, faAlignLeft,
  faFileCode, faFloppyDisk, faArrowsAlt, faFileMedical, faBriefcase, faPalette,
  faRotateRight, faArrowsLeftRight, faWandMagicSparkles, faSun, faCircleHalfStroke, faShieldHalved, faFileImage,
  faMusic, faVolumeXmark, faTachometerAlt, faBackward, faRepeat, faFilm, faGaugeHigh, faClosedCaptioning, faTv, faImages, faSliders
, faVolumeHigh} from '@fortawesome/free-solid-svg-icons';
import { DATABASE_ID, databases, isAppwriteConfigured } from './qofeno-appwrite';

export interface ToolCard {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  type: 'Free' | 'Pro';
  isNew?: boolean;
  addedAt?: string;
  isPopular: boolean;
  runs: string;
  desc: string;
  icon: IconDefinition;
  imageUrl: string | null;
  schemaMarkup: string;
  functionId?: string;
  tags?: string[];
}

export interface CategoryCard {
  name: string;
  count: number;
  sub?: string[];
}

export interface ToolCatalogState {
  tools: ToolCard[];
  featuredTools: ToolCard[];
  categoryCards: CategoryCard[];
  loading: boolean;
}

const TOOL_ICON_MAP: Record<string, IconDefinition> = {
  'PDF & Documents': faFilePdf,
  'Image Tools': faImageIcon,
  'Video Tools': faVideo,
  'AI & Automation': faRobot,
  'Developer Tools': faCode,
  'Data Tools': faChartBar,
  'Study Tools': faGraduationCap,
  'Writing Tools': faPenNib,
};

export const FALLBACK_TOOLS: ToolCard[] = [
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    name: 'JSON Parser & Formatter',
    category: 'Developer Tools',
    subcategory: 'Parsers',
    type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: true,
    runs: '0',
    desc: 'Format, validate, and beautify your JSON data directly in your browser. No data leaves your machine.',
    icon: faCode,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'JSON Parser & Formatter',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      description: 'Format, validate, and beautify your JSON data directly in your browser.',
    }),
    functionId: '2217055e890645a5af054eb1d6186efe',
  },
  {
    id: 'base64-encoder',
    slug: 'base64-encoder',
    name: 'Base64 Native Encoder',
    category: 'Developer Tools',
    subcategory: 'Encoders',
    type: 'Free',
    isNew: false,
    isPopular: true,
    runs: '0',
    desc: 'Securely encode or decode text and strings into Base64 format locally.',
    icon: faCode,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Base64 Native Encoder',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Securely encode or decode text and strings into Base64 format locally.',
    }),
    functionId: 'e63948affa5e460085fc9fc8b2a14dde',
  },
  {
    id: 'word-counter',
    slug: 'word-counter',
    name: 'Text Word & Character Counter',
    category: 'AI & Automation',
    subcategory: 'Text AI',
    type: 'Free',
    isNew: false,
    isPopular: false,
    runs: '0',
    desc: 'Instantly count words, characters, and reading time for any block of text.',
    icon: faCode,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Text Word & Character Counter',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Instantly count words, characters, and reading time for any block of text.',
    }),
    functionId: '4291a710a39643dca3c0f28615496583',
  },
  {
    id: 'text-case-converter',
    slug: 'text-case-converter',
    name: 'Text Case Converter',
    category: 'Developer Tools',
    subcategory: 'Text Utilities',
    type: 'Free',
    isNew: false,
    isPopular: false,
    runs: '0',
    desc: 'Convert text between lower, upper, title, camel, snake, kebab, and pascal case instantly.',
    icon: faCode,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Text Case Converter',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Convert text between lower, upper, title, camel, snake, kebab, and pascal case instantly.',
    }),
    functionId: '8be86de4f76b44d59fbfba912b749482',
  },
  {
    id: 'pdf-compressor',
    slug: 'pdf-compressor',
    name: 'PDF Compressor',
    category: 'PDF & Documents',
    subcategory: 'Compressors',
    type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: true,
    runs: '0',
    desc: 'Compress PDF files while keeping pages readable and delivery-friendly.',
    icon: faFileLines,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PDF Compressor',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Compress PDF files while keeping pages readable and delivery-friendly.',
    }),
    functionId: '8e0d74d220b841bab88e1eab430a48a4',
  },
  {
    id: 'pdf-merger',
    slug: 'pdf-merger',
    name: 'PDF Merger',
    category: 'PDF & Documents',
    subcategory: 'Combiners',
    type: 'Free',
    isNew: false,
    isPopular: true,
    runs: '0',
    desc: 'Combine multiple PDF files into one clean document.',
    icon: faFileLines,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PDF Merger',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Combine multiple PDF files into one clean document.',
    }),
    functionId: '5b901944578b4f55b49f0a3a5bf92ce5',
  },
  {
    id: 'pdf-splitter',
    slug: 'pdf-splitter',
    name: 'PDF Splitter',
    category: 'PDF & Documents',
    subcategory: 'Separators',
    type: 'Free',
    isNew: false,
    isPopular: false,
    runs: '0',
    desc: 'Split a PDF into individual pages or custom page ranges.',
    icon: faFileLines,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PDF Splitter',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Split a PDF into individual pages or custom page ranges.',
    }),
    functionId: '6d6e586a3b104a5bba400a8c6fddb020',
  },
  {
    id: 'pdf-to-word',
    slug: 'pdf-to-word',
    name: 'PDF to Word',
    category: 'PDF & Documents',
    subcategory: 'Converters',
    type: 'Pro',
    isNew: false,
    isPopular: false,
    runs: '0',
    desc: 'Extract text from PDFs and convert it into a Word document.',
    icon: faFileLines,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PDF to Word',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Extract text from PDFs and convert it into a Word document.',
    }),
    functionId: 'a6ef63d22525488890fcc6bfb2ea9b55',
  },
  {
    id: 'pdf-rotate',
    slug: 'pdf-rotate',
    name: 'PDF Rotate Pages',
    category: 'PDF & Documents',
    subcategory: 'Editors',
    type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false,
    runs: '0',
    desc: 'Rotate PDF pages permanently.',
    icon: faFileLines,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PDF Rotate Pages',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Rotate PDF pages permanently.',
    }),
    functionId: 'pdf-rotate',
  },
  {
    id: 'pdf-to-jpg',
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG',
    category: 'PDF & Documents',
    subcategory: 'Converters',
    type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: true,
    runs: '0',
    desc: 'Convert PDF pages into high-quality JPG images.',
    icon: faFileLines,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PDF to JPG',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Convert PDF pages into high-quality JPG images.',
    }),
    functionId: 'pdf-to-jpg',
  },
  {
    id: 'jpg-to-pdf',
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    category: 'PDF & Documents',
    subcategory: 'Converters',
    type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: true,
    runs: '0',
    desc: 'Convert JPG images into a single PDF document.',
    icon: faFileLines,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'JPG to PDF',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Convert JPG images into a single PDF document.',
    }),
    functionId: 'jpg-to-pdf',
  },
  {
    id: 'pdf-page-numbers',
    slug: 'pdf-page-numbers',
    name: 'Add Page Numbers to PDF',
    category: 'PDF & Documents',
    subcategory: 'Editors',
    type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false,
    runs: '0',
    desc: 'Add page numbers into PDFs with ease.',
    icon: faFileLines,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Add Page Numbers to PDF',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Add page numbers into PDFs with ease.',
    }),
    functionId: 'pdf-page-numbers',
  },
  {
    id: 'pdf-to-text',
    slug: 'pdf-to-text',
    name: 'PDF to Text',
    category: 'PDF & Documents',
    subcategory: 'Converters',
    type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false,
    runs: '0',
    desc: 'Extract text content from your PDF documents.',
    icon: faFileLines,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PDF to Text',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Extract text content from your PDF documents.',
    }),
    functionId: 'pdf-to-text',
  },
  {
    id: 'pdf-word-count',
    slug: 'pdf-word-count',
    name: 'PDF Word Count',
    category: 'PDF & Documents',
    subcategory: 'Analyzers',
    type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false,
    runs: '0',
    desc: 'Count the total number of words and characters in a PDF.',
    icon: faFileLines,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PDF Word Count',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Count the total number of words and characters in a PDF.',
    }),
    functionId: 'pdf-word-count',
  },
  {
    id: 'pdf-metadata-viewer',
    slug: 'pdf-metadata-viewer',
    name: 'PDF Metadata Viewer',
    category: 'PDF & Documents',
    subcategory: 'Analyzers',
    type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false,
    runs: '0',
    desc: 'View hidden metadata attributes in a PDF file.',
    icon: faFileLines,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PDF Metadata Viewer',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'View hidden metadata attributes in a PDF file.',
    }),
    functionId: 'pdf-metadata-viewer',
  },
  { id: 'pdf-to-excel', slug: 'pdf-to-excel', name: 'PDF to Excel', category: 'PDF & Documents', subcategory: 'Converters', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Convert PDF tables into Excel spreadsheet.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-to-excel' },
  { id: 'pdf-to-powerpoint', slug: 'pdf-to-powerpoint', name: 'PDF to PowerPoint', category: 'PDF & Documents', subcategory: 'Converters', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Convert PDF presentation into PowerPoint.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-to-powerpoint' },
  { id: 'pdf-to-html', slug: 'pdf-to-html', name: 'PDF to HTML', category: 'PDF & Documents', subcategory: 'Converters', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Convert PDF to HTML web pages.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-to-html' },
  { id: 'word-to-pdf', slug: 'word-to-pdf', name: 'Word to PDF', category: 'PDF & Documents', subcategory: 'Converters', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Convert Word documents to PDF.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'word-to-pdf' },
  { id: 'excel-to-pdf', slug: 'excel-to-pdf', name: 'Excel to PDF', category: 'PDF & Documents', subcategory: 'Converters', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Convert Excel spreadsheets to PDF.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'excel-to-pdf' },
  { id: 'powerpoint-to-pdf', slug: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', category: 'PDF & Documents', subcategory: 'Converters', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Convert PowerPoint presentations to PDF.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'powerpoint-to-pdf' },
  { id: 'pdf-ocr', slug: 'pdf-ocr', name: 'PDF OCR', category: 'PDF & Documents', subcategory: 'Analyzers', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Make scanned PDFs searchable.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-ocr' },
  { id: 'pdf-redact', slug: 'pdf-redact', name: 'PDF Redact', category: 'PDF & Documents', subcategory: 'Editors', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Remove sensitive information from PDFs.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-redact' },
  { id: 'pdf-watermark', slug: 'pdf-watermark', name: 'PDF Watermark', category: 'PDF & Documents', subcategory: 'Editors', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Add watermark to PDFs.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-watermark' },
  { id: 'pdf-unlock', slug: 'pdf-unlock', name: 'Unlock PDF', category: 'PDF & Documents', subcategory: 'Security', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Remove password from PDF.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-unlock' },
  { id: 'pdf-protect', slug: 'pdf-protect', name: 'Protect PDF', category: 'PDF & Documents', subcategory: 'Security', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Add password protection to PDF.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-protect' },
  { id: 'pdf-sign', slug: 'pdf-sign', name: 'Sign PDF', category: 'PDF & Documents', subcategory: 'Editors', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Add digital signature to PDF.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-sign' },
  { id: 'pdf-crop', slug: 'pdf-crop', name: 'Crop PDF', category: 'PDF & Documents', subcategory: 'Editors', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Crop PDF pages and margins.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-crop' },
  { id: 'pdf-repair', slug: 'pdf-repair', name: 'Repair PDF', category: 'PDF & Documents', subcategory: 'Editors', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Fix corrupted PDF files.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-repair' },
  { id: 'pdf-compare', slug: 'pdf-compare', name: 'Compare PDF', category: 'PDF & Documents', subcategory: 'Analyzers', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Compare two PDFs for differences.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-compare' },
  { id: 'pdf-flatten', slug: 'pdf-flatten', name: 'Flatten PDF', category: 'PDF & Documents', subcategory: 'Editors', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Flatten PDF form fields and annotations.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-flatten' },
  { id: 'pdf-thumbnail', slug: 'pdf-thumbnail', name: 'PDF Thumbnail', category: 'PDF & Documents', subcategory: 'Converters', type: 'Pro', isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0', desc: 'Generate thumbnails from PDF pages.', icon: faFileLines, imageUrl: null, schemaMarkup: '{}', functionId: 'pdf-thumbnail' },
  {
    id: 'image-resizer',
    slug: 'image-resizer',
    name: 'Image Resizer',
    category: 'Image Tools',
    subcategory: 'Resizers',
    type: 'Free',
    isNew: false,
    isPopular: true,
    runs: '0',
    desc: 'Resize images to specific dimensions and output formats.',
    icon: faImageIcon,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Image Resizer',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Resize images to specific dimensions and output formats.',
    }),
    functionId: '893ee730c40c45b8b65b4bf3129d2dea',
  },
  {
    id: 'image-compressor',
    slug: 'image-compressor',
    name: 'Image Compressor',
    category: 'Image Tools',
    subcategory: 'Compressors',
    type: 'Free',
    isNew: false,
    isPopular: true,
    runs: '0',
    desc: 'Reduce image file size with quality controls and modern formats.',
    icon: faImageIcon,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Image Compressor',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Reduce image file size with quality controls and modern formats.',
    }),
    functionId: 'ac2703f31bc2480b94014fe17ae69ff0',
  },
  {
    id: 'image-converter',
    slug: 'image-converter',
    name: 'Image Converter',
    category: 'Image Tools',
    subcategory: 'Converters',
    type: 'Free',
    isNew: false,
    isPopular: false,
    runs: '0',
    desc: 'Convert images between PNG, JPG, WEBP, AVIF, GIF, and TIFF.',
    icon: faImageIcon,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Image Converter',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Convert images between PNG, JPG, WEBP, AVIF, GIF, and TIFF.',
    }),
    functionId: 'e82741d4b61642c290ccb95909d2b1b4',
  },
  {
    id: 'image-bg-remover',
    slug: 'image-bg-remover',
    name: 'Image Background Remover',
    category: 'Image Tools',
    subcategory: 'Enhancers',
    type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false,
    runs: '0',
    desc: 'Remove simple backgrounds from images and export transparent PNGs.',
    icon: faImageIcon,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Image Background Remover',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Remove simple backgrounds from images and export transparent PNGs.',
    }),
    functionId: '9e1ae1632aeb4ce789399df3c236b24f',
  },
  {
    id: 'video-compressor',
    slug: 'video-compressor',
    name: 'Video Compressor',
    category: 'Video Tools',
    subcategory: 'Compressors',
    type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: true,
    runs: '0',
    desc: 'Compress videos for faster uploads and smaller sharing sizes.',
    icon: faVideo,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Video Compressor',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Compress videos for faster uploads and smaller sharing sizes.',
    }),
    functionId: '9b6795e4c10643ba80954c6c6cc65f32',
  },
  {
    id: 'video-trimmer',
    slug: 'video-trimmer',
    name: 'Video Trimmer',
    category: 'Video Tools',
    subcategory: 'Editors',
    type: 'Free',
    isNew: false,
    isPopular: false,
    runs: '0',
    desc: 'Trim video clips to the exact start and end points you need.',
    icon: faVideo,
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Video Trimmer',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'Trim video clips to the exact start and end points you need.',
    }),
    functionId: '94b5e417d36a4c5284618d8f70bd644b',
  },
  // ─── FREE PDF TOOLS ───────────────────────────────────────────────────────
  {
    id: 'pdf-compressor', slug: 'pdf-compressor', name: 'PDF Compressor',
    category: 'PDF & Documents', subcategory: 'Compression', type: 'Free',
    isNew: false, isPopular: true, runs: '0',
    desc: 'Compress PDF files with real Ghostscript compression. Choose Low, Medium, High, or Maximum quality.',
    icon: faCompress, imageUrl: null, functionId: '2f40b396e5dc35cbda8f2f9e5c07a6a2',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Compressor', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Compress PDF files with real Ghostscript compression.' }),
  },

  {
    id: 'pdf-merger', slug: 'pdf-merger', name: 'PDF Merger',
    category: 'PDF & Documents', subcategory: 'Editing', type: 'Free',
    isNew: false, isPopular: true, runs: '0',
    desc: 'Merge multiple PDFs into one. Drag-and-drop reorder before merging.',
    icon: faLayerGroup, imageUrl: null, functionId: '43d43f35eea8c0ceb04eb0e3e0c48d0a',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Merger', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Merge multiple PDFs into one.' }),
  },
  {
    id: 'pdf-splitter', slug: 'pdf-splitter', name: 'PDF Splitter',
    category: 'PDF & Documents', subcategory: 'Editing', type: 'Free',
    isNew: false, isPopular: true, runs: '0',
    desc: 'Split a PDF by page ranges, every N pages, or at bookmarks. Output single PDF or ZIP.',
    icon: faScissors, imageUrl: null, functionId: '8e4efe2e5c2b26f0a2a0c76e3e57d0a7',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Splitter', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Split a PDF by page ranges.' }),
  },
  {
    id: 'pdf-rotate', slug: 'pdf-rotate', name: 'Rotate PDF Pages',
    category: 'PDF & Documents', subcategory: 'Editing', type: 'Free',
    isNew: false, isPopular: false, runs: '0',
    desc: 'Rotate PDF pages 90°, 180°, or 270°. Apply to all, odd, even, or specific pages.',
    icon: faRotate, imageUrl: null, functionId: 'b9c4d12e3f5a7e8b1c2d4e5f6a7b8c9d',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Rotate PDF', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Rotate PDF pages.' }),
  },
  {
    id: 'pdf-to-jpg', slug: 'pdf-to-jpg', name: 'PDF to JPG',
    category: 'PDF & Documents', subcategory: 'Conversion', type: 'Free',
    isNew: false, isPopular: true, runs: '0',
    desc: 'Convert PDF pages to JPG images. Choose quality (50-100) and DPI (72-600). Output as ZIP.',
    icon: faImageIcon, imageUrl: null, functionId: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF to JPG', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Convert PDF to JPG images.' }),
  },
  {
    id: 'jpg-to-pdf', slug: 'jpg-to-pdf', name: 'JPG to PDF',
    category: 'PDF & Documents', subcategory: 'Conversion', type: 'Free',
    isNew: false, isPopular: true, runs: '0',
    desc: 'Convert JPG/PNG images to PDF. Multiple images, drag-and-drop order, page size and margin control.',
    icon: faFilePdf, imageUrl: null, functionId: 'c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'JPG to PDF', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Convert images to PDF.' }),
  },
  {
    id: 'pdf-page-numbers', slug: 'pdf-page-numbers', name: 'Add Page Numbers to PDF',
    category: 'PDF & Documents', subcategory: 'Editing', type: 'Free',
    isNew: false, isPopular: false, runs: '0',
    desc: 'Add page numbers to any PDF. Choose position, format (1, Page 1, 1 of N), font size, and start number.',
    icon: faListOl, imageUrl: null, functionId: 'd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Add Page Numbers to PDF', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Add page numbers to PDF.' }),
  },
  {
    id: 'pdf-to-text', slug: 'pdf-to-text', name: 'PDF to Text',
    category: 'PDF & Documents', subcategory: 'Extraction', type: 'Free',
    isNew: false, isPopular: false, runs: '0',
    desc: 'Extract all text from a PDF and download as a .txt file. Preserves paragraph structure.',
    icon: faFileLines, imageUrl: null, functionId: 'e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF to Text', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Extract text from PDF.' }),
  },
  {
    id: 'pdf-metadata-viewer', slug: 'pdf-metadata-viewer', name: 'View PDF Metadata',
    category: 'PDF & Documents', subcategory: 'Metadata', type: 'Free',
    isNew: false, isPopular: false, runs: '0',
    desc: 'View all metadata embedded in a PDF: title, author, subject, keywords, creation date, page count.',
    icon: faEye, imageUrl: null, functionId: 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Metadata Viewer', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'View PDF metadata.' }),
  },
  {
    id: 'pdf-delete-pages', slug: 'pdf-delete-pages', name: 'Delete PDF Pages',
    category: 'PDF & Documents', subcategory: 'Editing', type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Delete specific pages from a PDF. Enter page ranges like 1,3,5-7 and download the result.',
    icon: faBroom, imageUrl: null, functionId: 'pdf-delete-pages',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Delete PDF Pages', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Delete specific pages from a PDF.' }),
  },
  {
    id: 'pdf-reorder-pages', slug: 'pdf-reorder-pages', name: 'Reorder PDF Pages',
    category: 'PDF & Documents', subcategory: 'Editing', type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Reorder pages in a PDF. Specify the new page order or drag-and-drop to rearrange.',
    icon: faArrowsAlt, imageUrl: null, functionId: 'pdf-reorder-pages',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Reorder PDF Pages', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Reorder pages in a PDF.' }),
  },
  {
    id: 'pdf-extract-pages', slug: 'pdf-extract-pages', name: 'Extract PDF Pages',
    category: 'PDF & Documents', subcategory: 'Editing', type: 'Free',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Extract specific pages from a PDF document to create a new PDF.',
    icon: faFileLines, imageUrl: null, functionId: 'pdf-extract-pages',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Extract PDF Pages', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Extract specific pages from a PDF document.' }),
  },
  // ─── PRO PDF TOOLS ────────────────────────────────────────────────────────
  {
    id: 'pdf-to-word', slug: 'pdf-to-word', name: 'PDF to Word',
    category: 'PDF & Documents', subcategory: 'Conversion', type: 'Pro',
    isNew: false, isPopular: true, runs: '0',
    desc: 'Convert PDF to editable Word .docx file. Extracts text and preserves paragraph structure.',
    icon: faFileWord, imageUrl: null, functionId: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF to Word', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Convert PDF to Word.' }),
  },
  {
    id: 'pdf-to-excel', slug: 'pdf-to-excel', name: 'PDF to Excel',
    category: 'PDF & Documents', subcategory: 'Conversion', type: 'Pro',
    isNew: false, isPopular: true, runs: '0',
    desc: 'Convert PDF data tables to Excel .xlsx spreadsheets. Real table detection and formatting.',
    icon: faFileExcel, imageUrl: null, functionId: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF to Excel', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Convert PDF to Excel.' }),
  },
  {
    id: 'pdf-to-powerpoint', slug: 'pdf-to-powerpoint', name: 'PDF to PowerPoint',
    category: 'PDF & Documents', subcategory: 'Conversion', type: 'Pro',
    isNew: false, isPopular: false, runs: '0',
    desc: 'Convert PDF slides or pages to PowerPoint .pptx presentation slides.',
    icon: faFilePowerpoint, imageUrl: null, functionId: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF to PowerPoint', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Convert PDF to PowerPoint.' }),
  },
  {
    id: 'word-to-pdf', slug: 'word-to-pdf', name: 'Word to PDF',
    category: 'PDF & Documents', subcategory: 'Conversion', type: 'Pro',
    isNew: false, isPopular: true, runs: '0',
    desc: 'Convert Word .docx files to PDF. Preserves fonts, images, tables, and layout.',
    icon: faFilePdf, imageUrl: null, functionId: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Word to PDF', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Convert Word to PDF.' }),
  },
  {
    id: 'excel-to-pdf', slug: 'excel-to-pdf', name: 'Excel to PDF',
    category: 'PDF & Documents', subcategory: 'Conversion', type: 'Pro',
    isNew: false, isPopular: false, runs: '0',
    desc: 'Convert Excel .xlsx spreadsheets to PDF. All sheets, formulas resolved, formatted output.',
    icon: faFilePdf, imageUrl: null, functionId: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Excel to PDF', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Convert Excel to PDF.' }),
  },
  {
    id: 'powerpoint-to-pdf', slug: 'powerpoint-to-pdf', name: 'PowerPoint to PDF',
    category: 'PDF & Documents', subcategory: 'Conversion', type: 'Pro',
    isNew: false, isPopular: false, runs: '0',
    desc: 'Convert PowerPoint .pptx presentations to PDF. All slides, animations flattened.',
    icon: faFilePdf, imageUrl: null, functionId: '6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PowerPoint to PDF', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Convert PowerPoint to PDF.' }),
  },
  {
    id: 'pdf-watermark', slug: 'pdf-watermark', name: 'Add Watermark to PDF',
    category: 'PDF & Documents', subcategory: 'Security', type: 'Pro',
    isNew: false, isPopular: false, runs: '0',
    desc: 'Add text or image watermark to PDF. Control position, opacity, font size, rotation, and color.',
    icon: faWater, imageUrl: null, functionId: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Watermark', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Add watermark to PDF.' }),
  },
  {
    id: 'pdf-protect', slug: 'pdf-protect', name: 'Protect PDF',
    category: 'PDF & Documents', subcategory: 'Security', type: 'Pro',
    isNew: false, isPopular: true, runs: '0',
    desc: 'Add password protection and permission restrictions to PDF. Owner and user password support.',
    icon: faShield, imageUrl: null, functionId: '8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Protect PDF', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Password protect a PDF.' }),
  },
  {
    id: 'pdf-unlock', slug: 'pdf-unlock', name: 'Unlock PDF',
    category: 'PDF & Documents', subcategory: 'Security', type: 'Pro',
    isNew: false, isPopular: true, runs: '0',
    desc: 'Remove password protection and restrictions from PDF files you own.',
    icon: faUnlock, imageUrl: null, functionId: '9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Unlock PDF', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Remove PDF password.' }),
  },
  {
    id: 'pdf-ocr', slug: 'pdf-ocr', name: 'PDF OCR',
    category: 'PDF & Documents', subcategory: 'Extraction', type: 'Pro',
    isNew: false, isPopular: true, runs: '0',
    desc: 'Run OCR on scanned PDFs using Tesseract. Extract text and create searchable PDF. Supports multiple languages.',
    icon: faMagnifyingGlass, imageUrl: null, functionId: '0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF OCR', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'OCR scanned PDFs.' }),
  },
  {
    id: 'pdf-compare', slug: 'pdf-compare', name: 'PDF Comparison',
    category: 'PDF & Documents', subcategory: 'Analysis', type: 'Pro',
    isNew: false, isPopular: false, runs: '0',
    desc: 'Compare two PDFs and highlight differences. Shows similarity %, added/removed lines, generates diff report.',
    icon: faColumns, imageUrl: null, functionId: '1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Compare', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Compare two PDFs.' }),
  },
  {
    id: 'pdf-flatten', slug: 'pdf-flatten', name: 'PDF Flatten',
    category: 'PDF & Documents', subcategory: 'Editing', type: 'Pro',
    isNew: false, isPopular: false, runs: '0',
    desc: 'Flatten PDF form fields and annotations into the page content. Prevents editing of filled forms.',
    icon: faAlignLeft, imageUrl: null, functionId: '2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Flatten', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Flatten PDF form fields.' }),
  },
  {
    id: 'pdf-repair', slug: 'pdf-repair', name: 'PDF Repair',
    category: 'PDF & Documents', subcategory: 'Recovery', type: 'Pro',
    isNew: false, isPopular: false, runs: '0',
    desc: 'Attempt to repair corrupted or broken PDF files. Re-saves with valid structure.',
    icon: faFileMedical, imageUrl: null, functionId: '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Repair', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Repair corrupted PDFs.' }),
  },
  {
    id: 'pdf-crop', slug: 'pdf-crop', name: 'PDF Crop Tool',
    category: 'PDF & Documents', subcategory: 'Editing', type: 'Pro',
    isNew: false, isPopular: false, runs: '0',
    desc: 'Crop PDF pages by defining margins to remove. Specify top, bottom, left, right trim values.',
    icon: faCrop, imageUrl: null, functionId: '4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Crop', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Crop PDF pages.' }),
  },
  {
    id: 'pdf-metadata-editor', slug: 'pdf-metadata-editor', name: 'PDF Metadata Editor',
    category: 'PDF & Documents', subcategory: 'Metadata', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Edit PDF metadata: title, author, subject, keywords, producer, creator. Saves to new PDF.',
    icon: faPen, imageUrl: null, functionId: 'pdf-metadata-editor',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Metadata Editor', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Edit PDF metadata.' }),
  },
  {
    id: 'pdf-header-footer', slug: 'pdf-header-footer', name: 'PDF Header/Footer Editor',
    category: 'PDF & Documents', subcategory: 'Editing', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Add custom header and footer text to every page of a PDF. Supports {page}, {total}, {date} templates.',
    icon: faFileLines, imageUrl: null, functionId: 'pdf-header-footer',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Header Footer', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Add header/footer to PDF.' }),
  },
  {
    id: 'pdf-resize', slug: 'pdf-resize', name: 'PDF Resize Tool',
    category: 'PDF & Documents', subcategory: 'Editing', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Resize PDF pages to A4, Letter, Legal, A3, A5, or custom dimensions. Scale content to fit.',
    icon: faExpand, imageUrl: null, functionId: 'pdf-resize',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Resize', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Resize PDF pages.' }),
  },
  {
    id: 'pdf-grayscale', slug: 'pdf-grayscale', name: 'PDF Grayscale Converter',
    category: 'PDF & Documents', subcategory: 'Conversion', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Convert color PDF to grayscale. Uses Ghostscript for accurate color removal.',
    icon: faDroplet, imageUrl: null, functionId: 'pdf-grayscale',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Grayscale', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Convert PDF to grayscale.' }),
  },
  {
    id: 'batch-merge-pdfs', slug: 'batch-merge-pdfs', name: 'Batch Merge PDFs',
    category: 'PDF & Documents', subcategory: 'Batch Processing', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Merge up to 50 PDFs in a single batch operation. All pages combined in order.',
    icon: faFolder, imageUrl: null, functionId: 'batch-merge-pdfs',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Batch Merge PDFs', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Batch merge up to 50 PDFs.' }),
  },
  {
    id: 'pdf-form-creator', slug: 'pdf-form-creator', name: 'PDF Form Creator',
    category: 'PDF & Documents', subcategory: 'Forms', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Create interactive PDF forms with text fields, checkboxes, radio buttons, and dropdowns.',
    icon: faPenNib, imageUrl: null, functionId: 'pdf-form-creator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Form Creator', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Create PDF forms.' }),
  },
  {
    id: 'pdf-form-filler', slug: 'pdf-form-filler', name: 'PDF Form Filler',
    category: 'PDF & Documents', subcategory: 'Forms', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Fill existing PDF form fields programmatically by supplying field values in JSON.',
    icon: faCog, imageUrl: null, functionId: 'pdf-form-filler',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Form Filler', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Fill PDF form fields.' }),
  },
  {
    id: 'batch-compress-pdfs', slug: 'batch-compress-pdfs', name: 'Batch Compress PDFs',
    category: 'PDF & Documents', subcategory: 'Batch Processing', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Compress multiple PDF files simultaneously with Ghostscript. Maximum quality retention.',
    icon: faCompressArrowsAlt, imageUrl: null, functionId: 'batch-compress-pdfs',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Batch Compress PDFs', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Compress multiple PDF files simultaneously.' }),
  },
  {
    id: 'batch-convert-pdfs', slug: 'batch-convert-pdfs', name: 'Batch Convert PDFs',
    category: 'PDF & Documents', subcategory: 'Batch Processing', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Convert multiple files to or from PDF in one bulk operation.',
    icon: faFolder, imageUrl: null, functionId: 'batch-convert-pdfs',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Batch Convert PDFs', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Batch convert PDF files.' }),
  },
  {
    id: 'pdf-booklet-creator', slug: 'pdf-booklet-creator', name: 'PDF Booklet Creator',
    category: 'PDF & Documents', subcategory: 'Formatting', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Format standard PDFs into print-ready booklets with proper page imposition.',
    icon: faFileLines, imageUrl: null, functionId: 'pdf-booklet-creator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Booklet Creator', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Create PDF booklets.' }),
  },
  {
    id: 'pdf-portfolio-creator', slug: 'pdf-portfolio-creator', name: 'PDF Portfolio Creator',
    category: 'PDF & Documents', subcategory: 'Formatting', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Combine multiple file types into a single professional PDF portfolio.',
    icon: faBriefcase, imageUrl: null, functionId: 'pdf-portfolio-creator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Portfolio Creator', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Create PDF portfolios.' }),
  },
  {
    id: 'pdf-page-extractor-bulk', slug: 'pdf-page-extractor-bulk', name: 'PDF Page Extractor Bulk',
    category: 'PDF & Documents', subcategory: 'Batch Processing', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Extract specific pages from hundreds of PDFs at once.',
    icon: faScissors, imageUrl: null, functionId: 'pdf-page-extractor-bulk',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Bulk PDF Extractor', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Bulk extract PDF pages.' }),
  },
  {
    id: 'pdf-page-number-customizer', slug: 'pdf-page-number-customizer', name: 'PDF Page Number Customizer',
    category: 'PDF & Documents', subcategory: 'Formatting', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Advanced page numbering: start at specific pages, use Roman numerals, and custom positioning.',
    icon: faListOl, imageUrl: null, functionId: 'pdf-page-number-customizer',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Page Number Customizer', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Advanced PDF page numbering.' }),
  },
  {
    id: 'pdf-color-converter', slug: 'pdf-color-converter', name: 'PDF Color Converter',
    category: 'PDF & Documents', subcategory: 'Conversion', type: 'Pro',
    isNew: false, addedAt: '2026-06-23T07:23:08.166Z', isPopular: false, runs: '0',
    desc: 'Convert PDF color spaces (RGB to CMYK, etc) for professional printing.',
    icon: faPalette, imageUrl: null, functionId: 'pdf-color-converter',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PDF Color Converter', applicationCategory: 'UtilityApplication', operatingSystem: 'Web', description: 'Convert PDF color spaces.' }),
  },
  {
    id: 'crop-image', slug: 'crop-image', name: 'Crop Image',
    category: 'Image Tools', subcategory: 'Editing', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0',
    desc: 'Crop your images to specific dimensions instantly.',
    icon: faScissors, imageUrl: null, functionId: 'image-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Crop Image', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', description: 'Crop images instantly.' }),
  },
  {
    id: 'jpg-to-png', slug: 'jpg-to-png', name: 'JPG to PNG',
    category: 'Image Tools', subcategory: 'Conversion', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0',
    desc: 'Convert JPG/JPEG images to PNG with transparent background support.',
    icon: faFileImage, imageUrl: null, functionId: 'image-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'JPG to PNG Converter', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', description: 'Convert JPG to PNG.' }),
  },
  {
    id: 'png-to-webp', slug: 'png-to-webp', name: 'PNG to WebP',
    category: 'Image Tools', subcategory: 'Conversion', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0',
    desc: 'Convert PNG images to highly optimized WebP format for web performance.',
    icon: faFileImage, imageUrl: null, functionId: 'image-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PNG to WebP Converter', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', description: 'Convert PNG to WebP.' }),
  },
  {
    id: 'rotate-image', slug: 'rotate-image', name: 'Rotate Image',
    category: 'Image Tools', subcategory: 'Editing', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0',
    desc: 'Rotate images by 90, 180, or 270 degrees in seconds.',
    icon: faRotateRight, imageUrl: null, functionId: 'image-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Rotate Image', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', description: 'Rotate images quickly.' }),
  },
  {
    id: 'flip-image', slug: 'flip-image', name: 'Flip Image',
    category: 'Image Tools', subcategory: 'Editing', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0',
    desc: 'Mirror and flip your images horizontally or vertically.',
    icon: faArrowsLeftRight, imageUrl: null, functionId: 'image-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Flip Image', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', description: 'Flip and mirror images.' }),
  },
  {
    id: 'blur-image', slug: 'blur-image', name: 'Blur Image',
    category: 'Image Tools', subcategory: 'Filters', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0',
    desc: 'Apply a fast Gaussian blur to your images.',
    icon: faDroplet, imageUrl: null, functionId: 'image-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Blur Image', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', description: 'Blur images.' }),
  },
  {
    id: 'sharpen-image', slug: 'sharpen-image', name: 'Sharpen Image',
    category: 'Image Tools', subcategory: 'Filters', type: 'Pro',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0',
    desc: 'Enhance details and sharpen blurry edges in your images.',
    icon: faWandMagicSparkles, imageUrl: null, functionId: 'image-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Sharpen Image', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', description: 'Sharpen images.' }),
  },
  {
    id: 'brightness-adjust', slug: 'brightness-adjust', name: 'Brightness Adjust',
    category: 'Image Tools', subcategory: 'Filters', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0',
    desc: 'Increase or decrease the overall brightness of your images.',
    icon: faSun, imageUrl: null, functionId: 'image-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Brightness Adjust', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', description: 'Adjust image brightness.' }),
  },
  {
    id: 'contrast-adjust', slug: 'contrast-adjust', name: 'Contrast Adjust',
    category: 'Image Tools', subcategory: 'Filters', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0',
    desc: 'Enhance the contrast between light and dark areas of your photo.',
    icon: faCircleHalfStroke, imageUrl: null, functionId: 'image-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Contrast Adjust', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', description: 'Adjust image contrast.' }),
  },
  {
    id: 'watermark-image', slug: 'watermark-image', name: 'Watermark Image',
    category: 'Image Tools', subcategory: 'Security', type: 'Pro',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0',
    desc: 'Add text watermarks to your images to protect your copyrights.',
    icon: faShieldHalved, imageUrl: null, functionId: 'image-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Watermark Image', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', description: 'Add watermark to images.' }),
  },
  {
    id: 'trim-video', slug: 'trim-video', name: 'Trim Video', category: 'Video Tools', subcategory: 'Editing', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: true, runs: '0', desc: 'Trim and cut video clips easily.',
    icon: faScissors, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Trim Video', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'crop-video', slug: 'crop-video', name: 'Crop Video', category: 'Video Tools', subcategory: 'Editing', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Crop video dimensions to specific frames.',
    icon: faCrop, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Crop Video', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'compress-video', slug: 'compress-video', name: 'Compress Video', category: 'Video Tools', subcategory: 'Optimization', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: true, runs: '0', desc: 'Reduce video file size without losing quality.',
    icon: faCompress, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Compress Video', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'mp4-converter', slug: 'mp4-converter', name: 'Convert to MP4', category: 'Video Tools', subcategory: 'Conversion', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: true, runs: '0', desc: 'Convert any video to MP4 format.',
    icon: faVideo, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Convert to MP4', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'mov-converter', slug: 'mov-converter', name: 'Convert to MOV', category: 'Video Tools', subcategory: 'Conversion', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Convert your video files to Apple MOV format.',
    icon: faVideo, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Convert to MOV', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'avi-converter', slug: 'avi-converter', name: 'Convert to AVI', category: 'Video Tools', subcategory: 'Conversion', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Convert video files to AVI format.',
    icon: faVideo, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Convert to AVI', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'webm-converter', slug: 'webm-converter', name: 'Convert to WebM', category: 'Video Tools', subcategory: 'Conversion', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Convert video to web-optimized WebM format.',
    icon: faVideo, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Convert to WebM', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'merge-videos', slug: 'merge-videos', name: 'Merge Videos', category: 'Video Tools', subcategory: 'Editing', type: 'Pro',
    isNew: true, addedAt: new Date().toISOString(), isPopular: true, runs: '0', desc: 'Join multiple video clips into a single file.',
    icon: faObjectUngroup, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Merge Videos', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'rotate-video', slug: 'rotate-video', name: 'Rotate Video', category: 'Video Tools', subcategory: 'Editing', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Rotate your video 90, 180, or 270 degrees.',
    icon: faRotateRight, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Rotate Video', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'flip-video', slug: 'flip-video', name: 'Flip Video', category: 'Video Tools', subcategory: 'Editing', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Mirror and flip your video horizontally or vertically.',
    icon: faArrowsLeftRight, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Flip Video', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'extract-audio', slug: 'extract-audio', name: 'Extract Audio', category: 'Video Tools', subcategory: 'Audio', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: true, runs: '0', desc: 'Extract MP3 audio track from any video.',
    icon: faMusic, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Extract Audio', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'remove-audio', slug: 'remove-audio', name: 'Remove Audio', category: 'Video Tools', subcategory: 'Audio', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Mute a video by completely removing its audio track.',
    icon: faVolumeXmark, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Remove Audio', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'speed-changer-video', slug: 'speed-changer-video', name: 'Change Video Speed', category: 'Video Tools', subcategory: 'Editing', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Speed up or slow down your video playback.',
    icon: faTachometerAlt, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Change Video Speed', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'reverse-video', slug: 'reverse-video', name: 'Reverse Video', category: 'Video Tools', subcategory: 'Editing', type: 'Pro',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Play your video backwards.',
    icon: faBackward, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Reverse Video', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'loop-video', slug: 'loop-video', name: 'Loop Video', category: 'Video Tools', subcategory: 'Editing', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Loop a video multiple times to extend duration.',
    icon: faRepeat, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Loop Video', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'gif-maker-video', slug: 'gif-maker-video', name: 'Video to GIF', category: 'Video Tools', subcategory: 'Conversion', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: true, runs: '0', desc: 'Create animated GIFs from video clips.',
    icon: faFilm, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Video to GIF', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'thumbnail-extractor', slug: 'thumbnail-extractor', name: 'Extract Thumbnail', category: 'Video Tools', subcategory: 'Images', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Generate a JPG thumbnail from any timestamp in a video.',
    icon: faImage, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Extract Thumbnail', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'resolution-changer', slug: 'resolution-changer', name: 'Change Resolution', category: 'Video Tools', subcategory: 'Optimization', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Scale video resolution up or down.',
    icon: faExpand, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Change Resolution', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'fps-changer', slug: 'fps-changer', name: 'Change Framerate (FPS)', category: 'Video Tools', subcategory: 'Optimization', type: 'Pro',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Change the frames per second of your video.',
    icon: faGaugeHigh, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Change Framerate', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'metadata-viewer-video', slug: 'metadata-viewer-video', name: 'Video Metadata', category: 'Video Tools', subcategory: 'Analysis', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'View detailed FFprobe metadata of a video.',
    icon: faMagnifyingGlass, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Video Metadata', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'watermark-video', slug: 'watermark-video', name: 'Watermark Video', category: 'Video Tools', subcategory: 'Security', type: 'Pro',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Overlay a logo or image watermark onto your video.',
    icon: faShieldHalved, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Watermark Video', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'subtitle-creation', slug: 'subtitle-creation', name: 'Add Subtitles', category: 'Video Tools', subcategory: 'Editing', type: 'Pro',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Embed an SRT subtitle track into your video.',
    icon: faClosedCaptioning, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Add Subtitles', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'chapter-creator', slug: 'chapter-creator', name: 'Chapter Creator', category: 'Video Tools', subcategory: 'Editing', type: 'Pro',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Add chapter markers to your video.',
    icon: faListOl, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Chapter Creator', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'stabilization-video', slug: 'stabilization-video', name: 'Stabilize Video', category: 'Video Tools', subcategory: 'Filters', type: 'Pro',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Remove camera shake and stabilize your footage.',
    icon: faWandMagicSparkles, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Stabilize Video', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'aspect-ratio-converter', slug: 'aspect-ratio-converter', name: 'Aspect Ratio Converter', category: 'Video Tools', subcategory: 'Optimization', type: 'Free',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Change the display aspect ratio of your video.',
    icon: faTv, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Aspect Ratio Converter', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'frame-extractor', slug: 'frame-extractor', name: 'Extract Frames', category: 'Video Tools', subcategory: 'Images', type: 'Pro',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Extract every frame of a video as a ZIP archive of images.',
    icon: faImages, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Extract Frames', applicationCategory: 'MultimediaApplication' }),
  },
  {
    id: 'audio-sync', slug: 'audio-sync', name: 'Audio Sync', category: 'Video Tools', subcategory: 'Audio', type: 'Pro',
    isNew: true, addedAt: new Date().toISOString(), isPopular: false, runs: '0', desc: 'Fix out-of-sync audio by shifting it forward or backward.',
    icon: faSliders, imageUrl: null, functionId: 'video-manipulator',
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Audio Sync', applicationCategory: 'MultimediaApplication' }),
  }
];

const FALLBACK_TOOL_LOOKUP = Object.fromEntries(FALLBACK_TOOLS.map((tool) => [tool.slug, tool]));

function iconForTool(doc: any): IconDefinition {
  return TOOL_ICON_MAP[doc.category] || TOOL_ICON_MAP[doc.subcategory] || faCode;
}

function toCard(doc: any, viewsBySlug: Record<string, number> = {}): ToolCard {
  const slug = String(doc.slug || doc.$id || doc.id || '').trim();
  const fallback = FALLBACK_TOOL_LOOKUP[slug];
  const name = String(doc.name || fallback?.name || slug || 'Untitled Tool');
  const category = String(doc.category || fallback?.category || 'Developer Tools');
  const subcategory = String(doc.subcategory || fallback?.subcategory || 'General');
  const description = String(doc.description || doc.desc || fallback?.desc || '');
  const viewCount = viewsBySlug[slug] ?? Number(doc.runs || doc.views || 0);

  return {
    id: slug,
    slug,
    name,
    category,
    subcategory,
    type: doc.is_free === false || String(doc.type || '').toLowerCase() === 'pro' ? 'Pro' : 'Free',
    isNew: Boolean(doc.is_new),
    isPopular: Boolean(doc.is_popular ?? doc.isPopular),
    runs: String(viewCount),
    desc: description,
    icon: iconForTool(doc),
    imageUrl: doc.icon && /^https?:\/\//i.test(String(doc.icon)) ? String(doc.icon) : null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name,
      applicationCategory: category.replace(/ Tools$/i, 'Application'),
      operatingSystem: 'Web',
      description,
    }),
    functionId: doc.function_id || fallback?.functionId,
    tags: Array.isArray(doc.tags) ? doc.tags.map((tag: unknown) => String(tag)) : [],
  };
}

function buildCategoryCards(tools: ToolCard[]): CategoryCard[] {
  const grouped = new Map<string, Set<string>>();
  tools.forEach((tool) => {
    if (!grouped.has(tool.category)) grouped.set(tool.category, new Set());
    grouped.get(tool.category)!.add(tool.subcategory);
  });

  return [
    { name: 'All Tools', count: tools.length },
    ...Array.from(grouped.entries()).map(([name, subs]) => ({
      name,
      count: tools.filter((tool) => tool.category === name).length,
      sub: Array.from(subs),
    })),
  ];
}

function pickFeaturedTools(tools: ToolCard[]): ToolCard[] {
  return [...tools]
    .sort((left, right) => Number(right.isPopular) - Number(left.isPopular) || Number(right.isNew) - Number(left.isNew) || Number(right.runs) - Number(left.runs))
    .slice(0, 3);
}

export function useToolCatalog(): ToolCatalogState {
  const [state, setState] = useState<ToolCatalogState>({
    tools: FALLBACK_TOOLS,
    featuredTools: pickFeaturedTools(FALLBACK_TOOLS),
    categoryCards: buildCategoryCards(FALLBACK_TOOLS),
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      if (!isAppwriteConfigured()) {
        if (!cancelled) {
          setState({
            tools: FALLBACK_TOOLS,
            featuredTools: pickFeaturedTools(FALLBACK_TOOLS),
            categoryCards: buildCategoryCards(FALLBACK_TOOLS),
            loading: false,
          });
        }
        return;
      }

      try {
        const [toolDocs, viewDocs] = await Promise.all([
          databases.listDocuments(DATABASE_ID, 'tools', [Query.orderAsc('name'), Query.limit(500)]),
          databases.listDocuments(DATABASE_ID, 'tool_views', [Query.limit(500)]),
        ]);

        const viewsBySlug = Object.fromEntries(
          (viewDocs.documents || []).map((doc: any) => [String(doc.tool_slug), Number(doc.count || 0)])
        );
        const tools = (toolDocs.documents || []).map((doc: any) => toCard(doc, viewsBySlug));

        if (!cancelled) {
          setState({
            tools,
            featuredTools: pickFeaturedTools(tools),
            categoryCards: buildCategoryCards(tools),
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            tools: FALLBACK_TOOLS,
            featuredTools: pickFeaturedTools(FALLBACK_TOOLS),
            categoryCards: buildCategoryCards(FALLBACK_TOOLS),
            loading: false,
          });
        }
      }
    };

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
