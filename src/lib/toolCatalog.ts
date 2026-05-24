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
];

function iconForTool(doc: any): LucideIcon {
  return TOOL_ICON_MAP[doc.category] || TOOL_ICON_MAP[doc.subcategory] || Code2;
}

function toCard(doc: any, viewsBySlug: Record<string, number> = {}): ToolCard {
  const slug = String(doc.slug || doc.$id || doc.id || '').trim();
  const name = String(doc.name || slug || 'Untitled Tool');
  const category = String(doc.category || 'Developer Tools');
  const subcategory = String(doc.subcategory || 'General');
  const description = String(doc.description || doc.desc || '');
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
    functionId: doc.function_id,
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
