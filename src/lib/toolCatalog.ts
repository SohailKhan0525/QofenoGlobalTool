import { useEffect, useState } from 'react';
import { Query } from 'appwrite';
import {
  BarChart3,
  Code2,
  Cpu,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  type LucideIcon,
  Sparkles,
  Video,
} from 'lucide-react';
import { DATABASE_ID, databases, isAppwriteConfigured } from './qofeno-appwrite';

export interface ToolCard {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  type: 'Free' | 'Pro';
  isNew: boolean;
  isPopular: boolean;
  runs: string;
  desc: string;
  icon: LucideIcon;
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

const TOOL_ICON_MAP: Record<string, LucideIcon> = {
  'PDF & Documents': FileText,
  'Image Tools': ImageIcon,
  'Video Tools': Video,
  'AI & Automation': Cpu,
  'Developer Tools': Code2,
  'Data Tools': BarChart3,
  'Study Tools': GraduationCap,
  'Writing Tools': Sparkles,
};

export const FALLBACK_TOOLS: ToolCard[] = [
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    name: 'JSON Parser & Formatter',
    category: 'Developer Tools',
    subcategory: 'Parsers',
    type: 'Free',
    isNew: true,
    isPopular: true,
    runs: '0',
    desc: 'Format, validate, and beautify your JSON data directly in your browser. No data leaves your machine.',
    icon: Code2,
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
    icon: Code2,
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
    icon: Code2,
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
    icon: Code2,
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
    isNew: true,
    isPopular: true,
    runs: '0',
    desc: 'Compress PDF files while keeping pages readable and delivery-friendly.',
    icon: FileText,
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
    icon: FileText,
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
    icon: FileText,
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
    type: 'Free',
    isNew: false,
    isPopular: false,
    runs: '0',
    desc: 'Extract text from PDFs and convert it into a Word document.',
    icon: FileText,
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
    icon: ImageIcon,
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
    icon: ImageIcon,
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
    icon: ImageIcon,
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
    isNew: true,
    isPopular: false,
    runs: '0',
    desc: 'Remove simple backgrounds from images and export transparent PNGs.',
    icon: ImageIcon,
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
    isNew: true,
    isPopular: true,
    runs: '0',
    desc: 'Compress videos for faster uploads and smaller sharing sizes.',
    icon: Video,
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
    icon: Video,
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
];

const FALLBACK_TOOL_LOOKUP = Object.fromEntries(FALLBACK_TOOLS.map((tool) => [tool.slug, tool]));

function iconForTool(doc: any): LucideIcon {
  return TOOL_ICON_MAP[doc.category] || TOOL_ICON_MAP[doc.subcategory] || Code2;
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
          databases.listDocuments(DATABASE_ID, 'tools', [Query.orderAsc('name')]),
          databases.listDocuments(DATABASE_ID, 'tool_views', [Query.limit(100)]),
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
