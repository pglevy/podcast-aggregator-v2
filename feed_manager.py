import json
import feedparser
from datetime import datetime
from urllib.parse import quote
import logging
import traceback
from email.utils import parsedate_to_datetime

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class FeedManager:
    def __init__(self, feeds_file):
        self.feeds_file = feeds_file
        self.episodes_cache = None
        self.fallback_image = "https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/icons/podcast.svg"
        
    def load_feeds(self):
        try:
            with open(self.feeds_file) as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Error loading feeds file: {str(e)}")
            return []
            
    def parse_date(self, date_str):
        """Parse date string in various formats."""
        try:
            # Try email date format first (RFC 2822)
            return parsedate_to_datetime(date_str).timestamp()
        except Exception:
            try:
                # Try common RSS date format
                return datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S %z').timestamp()
            except Exception:
                try:
                    # Try ISO format
                    return datetime.fromisoformat(date_str).timestamp()
                except Exception as e:
                    logging.warning(f"Could not parse date '{date_str}': {str(e)}")
                    return 0
            
    def get_all_episodes(self):
        if self.episodes_cache:
            return self.episodes_cache
            
        episodes = []
        feeds = self.load_feeds()
        
        for feed in feeds:
            try:
                logging.info(f"Processing feed: {feed['name']} ({feed['url']})")
                parsed = feedparser.parse(feed['url'])
                
                if parsed.bozo:
                    logging.warning(f"Feed parsing warning for {feed['url']}: {parsed.bozo_exception}")
                
                for entry in parsed.entries:
                    try:
                        # Get audio URL with detailed logging
                        audio_url = next((link.href for link in entry.links if 'audio' in link.type), None)
                        if not audio_url:
                            logging.warning(f"No audio URL found for episode: {entry.title}")
                            continue

                        # Get image with fallback
                        image = (
                            getattr(parsed.feed, 'image', {}).get('href') or
                            getattr(entry, 'image', {}).get('href') or
                            self.fallback_image
                        )
                        
                        episode = {
                            'title': entry.title,
                            'description': getattr(entry, 'description', ''),
                            'published': self.parse_date(entry.published),
                            'audio_url': audio_url,
                            'image': image,
                            'podcast_title': parsed.feed.title,
                            'guid': quote(entry.get('guid', entry.id), safe='')
                        }
                        episodes.append(episode)
                        logging.debug(f"Successfully processed episode: {episode['title']}")
                    except Exception as e:
                        logging.error(f"Error processing entry in feed {feed['url']}: {str(e)}\n{traceback.format_exc()}")
            except Exception as e:
                logging.error(f"Error processing feed {feed['url']}: {str(e)}\n{traceback.format_exc()}")
                
        self.episodes_cache = episodes
        logging.info(f"Successfully processed {len(episodes)} episodes from {len(feeds)} feeds")
        return episodes
        
    def get_episode_by_guid(self, guid):
        episodes = self.get_all_episodes()
        return next((ep for ep in episodes if ep['guid'] == guid), None)
