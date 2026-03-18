import { useEffect } from 'react';

interface SeoOptions {
  keywords?: string;
  canonical?: string;
  robots?: string;
  noIndex?: boolean;
  og?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  };
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

function setOrCreateMeta(attribute: 'name' | 'property', value: string, content: string) {
  let metaTag = document.querySelector(`meta[${attribute}="${value}"]`);
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attribute, value);
    document.head.appendChild(metaTag);
  }

  metaTag.setAttribute('content', content);
}

function removeMeta(attribute: 'name' | 'property', value: string) {
  const metaTag = document.querySelector(`meta[${attribute}="${value}"]`);
  if (metaTag) {
    metaTag.remove();
  }
}

export function useSeo(title: string, description: string, options?: SeoOptions) {
  useEffect(() => {
    document.title = title;

    setOrCreateMeta('name', 'description', description);

    if (options?.keywords) {
      setOrCreateMeta('name', 'keywords', options.keywords);
    }

    const robotsContent = options?.robots ?? (options?.noIndex ? 'noindex, nofollow' : 'index, follow');
    setOrCreateMeta('name', 'robots', robotsContent);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }

    if (options?.canonical) {
      canonicalLink.setAttribute('href', options.canonical);
    } else {
      canonicalLink.removeAttribute('href');
    }

    setOrCreateMeta('property', 'og:title', options?.og?.title ?? title);
    setOrCreateMeta('property', 'og:description', options?.og?.description ?? description);
    setOrCreateMeta('property', 'og:type', options?.og?.type ?? 'website');
    if (options?.og?.url ?? options?.canonical) {
      setOrCreateMeta('property', 'og:url', options?.og?.url ?? options?.canonical ?? '');
    } else {
      removeMeta('property', 'og:url');
    }
    setOrCreateMeta('name', 'twitter:card', options?.og?.image ? 'summary_large_image' : 'summary');
    setOrCreateMeta('name', 'twitter:title', options?.og?.title ?? title);
    setOrCreateMeta('name', 'twitter:description', options?.og?.description ?? description);

    if (options?.og?.image) {
      setOrCreateMeta('property', 'og:image', options.og.image);
      setOrCreateMeta('name', 'twitter:image', options.og.image);
    } else {
      removeMeta('property', 'og:image');
      removeMeta('name', 'twitter:image');
    }

    const structuredDataScriptId = 'sakitrailer29-structured-data';
    const existingStructuredData = document.getElementById(structuredDataScriptId);
    if (existingStructuredData) {
      existingStructuredData.remove();
    }

    if (options?.structuredData) {
      const scriptTag = document.createElement('script');
      scriptTag.id = structuredDataScriptId;
      scriptTag.type = 'application/ld+json';
      scriptTag.text = JSON.stringify(options.structuredData);
      document.head.appendChild(scriptTag);
    }
  }, [description, options, title]);
}
