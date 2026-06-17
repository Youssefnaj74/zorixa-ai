export type BlogAuthor = {
  name: string;
  role: string;
  bio: string;
};

export type BlogSection = {
  id: string;
  title: string;
  level?: 2 | 3;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  readingTimeMinutes: number;
  tags: string[];
  /** Model SEO page slugs for internal linking. */
  relatedModelSlugs: string[];
  relatedPostSlugs?: string[];
  sections: BlogSection[];
};
