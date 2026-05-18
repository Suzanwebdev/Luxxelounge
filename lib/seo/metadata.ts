import type { Metadata } from "next";
import {
  SEO_BRAND,
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_TITLE,
  SEO_KEYWORDS,
  SEO_OG_IMAGE_PATH
} from "@/lib/seo/constants";
import { absoluteMediaUrl, absoluteUrl, getSiteOrigin } from "@/lib/seo/urls";

export type PageSeoInput = {
  title: string;
  description?: string;
  path: string;
  keywords?: string[];
  image?: string | null;
  /** When true, sets robots noindex (e.g. filtered shop URLs). */
  noIndex?: boolean;
  /** Override canonical path (defaults to `path`). */
  canonicalPath?: string;
};

function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function buildPageMetadata(input: PageSeoInput): Metadata {
  const description = truncate(input.description || SEO_DEFAULT_DESCRIPTION, 160);
  const canonical = absoluteUrl(input.canonicalPath ?? input.path);
  const image = absoluteMediaUrl(input.image) ?? absoluteUrl(SEO_OG_IMAGE_PATH);
  const keywords = input.keywords?.length ? input.keywords : [...SEO_KEYWORDS];

  const pageTitle = input.title.includes("|") ? { absolute: input.title.trim() } : input.title;

  return {
    title: pageTitle,
    description,
    keywords,
    alternates: {
      canonical
    },
    robots: input.noIndex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1
          }
        },
    openGraph: {
      type: "website",
      locale: "en_GH",
      url: canonical,
      siteName: SEO_BRAND,
      title: input.title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: input.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [image]
    }
  };
}

export function productPageTitle(productName: string): string {
  return `${productName} | ${SEO_BRAND}`;
}

export function buildRootMetadata(): Metadata {
  const origin = getSiteOrigin();
  return {
    metadataBase: new URL(origin),
    title: {
      default: SEO_DEFAULT_TITLE,
      template: `%s | ${SEO_BRAND}`
    },
    description: SEO_DEFAULT_DESCRIPTION,
    keywords: [...SEO_KEYWORDS],
    applicationName: SEO_BRAND,
    authors: [{ name: SEO_BRAND, url: origin }],
    creator: SEO_BRAND,
    publisher: SEO_BRAND,
    formatDetection: {
      email: false,
      address: false,
      telephone: false
    },
    alternates: {
      canonical: origin
    },
    openGraph: {
      type: "website",
      locale: "en_GH",
      url: origin,
      siteName: SEO_BRAND,
      title: SEO_DEFAULT_TITLE,
      description: SEO_DEFAULT_DESCRIPTION,
      images: [{ url: absoluteUrl(SEO_OG_IMAGE_PATH), width: 1200, height: 630, alt: SEO_DEFAULT_TITLE }]
    },
    twitter: {
      card: "summary_large_image",
      title: SEO_DEFAULT_TITLE,
      description: SEO_DEFAULT_DESCRIPTION,
      images: [absoluteUrl(SEO_OG_IMAGE_PATH)]
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
};
