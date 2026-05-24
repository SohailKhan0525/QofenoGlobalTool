import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  schemaMarkup?: string;
  author?: string;
}

export function SEO({ 
  title, 
  description = 'Qofeno - Professional online tools for developers and creators.', 
  keywords = 'tools, developers, creators, online tools, qofeno',
  ogImage = 'https://qofeno.io/og-image.jpg',
  canonicalUrl,
  schemaMarkup,
  author = 'Mohd Zaheer Uddin'
}: SEOProps) {
  useEffect(() => {
    document.title = `${title} | Qofeno`;
    
    // Update or create meta description
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };

    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('author', author);
    
    // OpenGraph tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:url', canonicalUrl || window.location.href, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:site_name', 'Qofeno', true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);

    // Robots / Indexing
    setMetaTag('robots', 'index, follow');
    setMetaTag('googlebot', 'index, follow');

    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', canonicalUrl);
      } else {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        canonical.setAttribute('href', canonicalUrl);
        document.head.appendChild(canonical);
      }
    }

    // Schema Markup Structure Data
    if (schemaMarkup) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (script) {
        script.innerHTML = schemaMarkup;
      } else {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.innerHTML = schemaMarkup;
        document.head.appendChild(script);
      }
    }

  }, [title, description, keywords, ogImage, canonicalUrl, schemaMarkup, author]);

  return null;
}
