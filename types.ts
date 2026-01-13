export enum ContentType {
  BLOG = 'Blog Article',
  LINKEDIN = 'LinkedIn Post',
  INSTAGRAM = 'Instagram Caption'
}

export enum ContentTone {
  PROBLEM_SOLVING = 'Problem Solving',
  INFORMATIONAL = 'Informational',
  ENTERTAINMENT = 'Entertainment',
  BUSINESS = 'Business/Strategic'
}

export enum ContentFormat {
  STANDARD = 'Standard Article',
  NUMBERED_LIST = 'Numbered List (e.g., "10 Ways to...")',
  STEP_BY_STEP = 'Step-by-Step Guide',
  PROBLEM_SOLUTION = 'Problem → Solution',
  FAQ_STYLE = 'FAQ Style',
  TIPS_TRICKS = 'Tips & Tricks'
}

export interface ContentQuality {
  readabilityScore: number; // 0-100, higher = easier to read
  estimatedReadTime: number; // minutes
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  uniquenessIndicators: string[];
  suggestedImprovements: string[];
}

export enum IdeaStatus {
  SUGGESTED = 'suggested',
  SELECTED = 'selected',
  GENERATED = 'generated',
  REJECTED = 'rejected'
}

export interface Idea {
  id: string;
  title: string;
  brief: string;
  searchTrendContext?: string; // Why is this trending?
  status: IdeaStatus;
  category: string;
}

export interface GeneratedContent {
  id: string; // Matches Idea ID
  title: string;
  content: string; // Markdown format
  imageUrl?: string;
  imageSearchTerm?: string;
  platform: ContentType;
  tone?: ContentTone;
  format?: ContentFormat;
  wordCount: number;
  sources?: { title: string; uri: string }[];
  keywords?: string[]; // SEO Keywords
  socialSnippets?: { // Auto-generated social posts
    twitter: string;
    linkedin: string;
  };
  quality?: ContentQuality; // Quality metrics
  createdAt: number;
}

export interface AppState {
  pastTopics: string[]; // List of titles to exclude in future generations
}