export interface SourceConfig {
  name: string;
  outlet: string;
  language: 'mr' | 'en';
  url: string;
  active: boolean;
  note?: string;
}

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  outlet: string;
  language: 'mr' | 'en';
  sourceName: string;
  imageUrl?: string | null;
}

export interface StoryCluster {
  clusterId: string;
  headlineSummary: string;
  items: FeedItem[];
  outlets: string[];
  languages: ('mr' | 'en')[];
  categoryHint: string;
  firstSeen: string;
  imageUrl?: string | null;
}

export interface GeneratedArticleDraft {
  title: string;
  slug: string;
  excerpt: string;
  language: 'mr' | 'en';
  categorySlug: string;
  cover_image_url?: string | null;
  content: {
    type: 'doc';
    content: any[];
  };
  confidence: 'high' | 'medium' | 'low';
  verification_notes: string;
  image_suggestion: string;
  image_keywords: string[];
  flags: {
    needs_careful_review: boolean;
    cluster_size: number;
    outlets: string[];
    [key: string]: any;
  };
  source_urls: {
    outlet: string;
    url: string;
    title: string;
  }[];
}

export interface PipelineRunReport {
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'success' | 'failed' | 'partial';
  sourcesChecked: number;
  sourcesFailed: string[];
  itemsFetched: number;
  itemsDeduplicated: number;
  clustersFormed: number;
  eligibleClusters: number;
  draftsCreated: number;
  apiCallsUsed: number;
  errors: Array<{ step: string; message: string }>;
  drafts: GeneratedArticleDraft[];
}

