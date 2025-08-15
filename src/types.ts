export interface Feed {
  name: string;
  url: string;
}

export interface Episode {
  guid: string;
  title: string;
  description: string;
  link: string;
  audioUrl: string;
  published: number;
  duration?: string;
  image?: string;
  feedName: string;
  feedImage?: string;
}

export interface FeedConfig {
  feeds: Feed[];
}

export interface TemplateData {
  episodes?: Episode[];
  episode?: Episode;
  title?: string;
}