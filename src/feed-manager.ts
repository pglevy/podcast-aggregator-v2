import Parser from 'rss-parser';
import * as fs from 'fs-extra';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Episode, Feed } from './types';

export class FeedManager {
  private parser: Parser;
  private episodesCache: Episode[] | null = null;
  private episodesPerFeed: number;
  private feedsFile: string;

  private customFallbacks: Record<string, string> = {
    "This American Life": "https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/icons/headphones.svg",
    "NPR News Now": "https://media.npr.org/images/podcasts/primary/icon_500005-045e9424cae3a72b93704bea48767c9e6f8973a8.jpg?s=1400",
    "TED Radio Hour": "https://media.npr.org/images/podcasts/primary/icon_510298-c3b09c45c6ef5b6af87f0c5982d68c216cda43dc.jpg?s=1400"
  };

  private genericFallback = "https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/icons/podcast.svg";

  constructor(feedsFile: string, episodesPerFeed: number = 10) {
    this.feedsFile = feedsFile;
    this.episodesPerFeed = episodesPerFeed;
    this.parser = new Parser({
      customFields: {
        feed: ['image', 'itunes:image'],
        item: ['itunes:image', 'media:thumbnail', 'enclosure', 'itunes:duration']
      }
    });
  }

  async loadFeeds(): Promise<Feed[]> {
    try {
      const data = await fs.readJson(this.feedsFile);
      return data;
    } catch (error) {
      console.error(`Error loading feeds file: ${error}`);
      return [];
    }
  }

  private parseDate(dateStr: string): number {
    try {
      // Try parsing various date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.getTime() / 1000; // Convert to timestamp
      }
      return 0;
    } catch (error) {
      console.warn(`Could not parse date '${dateStr}': ${error}`);
      return 0;
    }
  }

  private extractImageUrl(entry: any, feed: any, feedName: string): string {
    // Priority order for images:
    // 1. Entry media thumbnail
    // 2. Entry iTunes image
    // 3. Entry image attribute
    // 4. Feed iTunes image
    // 5. Feed image
    // 6. Custom fallback for specific feeds
    // 7. Generic fallback

    if (entry['media:thumbnail'] && entry['media:thumbnail']['$'] && entry['media:thumbnail']['$'].url) {
      return entry['media:thumbnail']['$'].url;
    }

    if (entry['itunes:image'] && entry['itunes:image']['$'] && entry['itunes:image']['$'].href) {
      return entry['itunes:image']['$'].href;
    }

    if (entry.image && typeof entry.image === 'string') {
      return entry.image;
    }

    if (feed['itunes:image'] && feed['itunes:image']['$'] && feed['itunes:image']['$'].href) {
      return feed['itunes:image']['$'].href;
    }

    if (feed.image && feed.image.url) {
      return feed.image.url;
    }

    if (feed.image && typeof feed.image === 'string') {
      return feed.image;
    }

    return this.customFallbacks[feedName] || this.genericFallback;
  }

  async getAllEpisodes(): Promise<Episode[]> {
    if (this.episodesCache) {
      return this.episodesCache;
    }

    const allEpisodes: Episode[] = [];
    const feeds = await this.loadFeeds();

    for (const feed of feeds) {
      try {
        console.log(`Processing feed: ${feed.name} (${feed.url})`);
        const parsedFeed = await this.parser.parseURL(feed.url);

        if (!parsedFeed.items || parsedFeed.items.length === 0) {
          console.warn(`No items found in feed: ${feed.name}`);
          continue;
        }

        const feedEpisodes = parsedFeed.items
          .slice(0, this.episodesPerFeed)
          .map((item: any) => {
            // Extract audio URL
            let audioUrl = '';
            if (item.enclosure && item.enclosure.url) {
              audioUrl = item.enclosure.url;
            } else if (item.link && item.link.includes('.mp3')) {
              audioUrl = item.link;
            }

            if (!audioUrl) {
              console.warn(`No audio URL found for episode: ${item.title}`);
              return null;
            }

            const episode: Episode = {
              guid: item.guid || item.link || item.title,
              title: item.title || 'Untitled Episode',
              description: item.contentSnippet || item.content || item.summary || '',
              link: item.link || '',
              audioUrl,
              published: this.parseDate(item.pubDate || item.isoDate || ''),
              duration: item['itunes:duration'] || undefined,
              image: this.extractImageUrl(item, parsedFeed, feed.name),
              feedName: feed.name,
              feedImage: this.extractImageUrl({}, parsedFeed, feed.name)
            };

            return episode;
          })
          .filter((episode): episode is Episode => episode !== null);

        allEpisodes.push(...feedEpisodes);
        console.log(`Successfully processed ${feedEpisodes.length} episodes from ${feed.name}`);
      } catch (error) {
        console.error(`Error processing feed ${feed.name}: ${error}`);
      }
    }

    console.log(`Successfully processed ${allEpisodes.length} episodes from ${feeds.length} feeds`);
    this.episodesCache = allEpisodes;
    return allEpisodes;
  }

  async getEpisodeByGuid(guid: string): Promise<Episode | null> {
    const episodes = await this.getAllEpisodes();
    
    // Try exact match first
    let episode = episodes.find(ep => ep.guid === guid);
    
    // If not found, try URL-decoded version
    if (!episode) {
      const decodedGuid = decodeURIComponent(guid);
      episode = episodes.find(ep => ep.guid === decodedGuid);
    }
    
    // If still not found, try URL-encoded version
    if (!episode) {
      const encodedGuid = encodeURIComponent(guid);
      episode = episodes.find(ep => ep.guid === encodedGuid);
    }
    
    return episode || null;
  }

  clearCache(): void {
    this.episodesCache = null;
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    
    // If it's today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    
    // If it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    
    // If it's this year
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'MMMM d \'at\' h:mm a');
    }
    
    // If it's a different year
    return format(date, 'MMMM d, yyyy \'at\' h:mm a');
  }
}