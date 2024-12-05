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
        self.generic_fallback = "https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/icons/podcast.svg"
        self.custom_fallbacks = {
            "This American Life": "https://www.thisamericanlife.org/sites/default/files/tal-logo.png",
            "NPR News Now": "https://media.npr.org/images/podcasts/primary/icon_500005-045e9424cae3a72b93704bea48767c9e6f8973a8.jpg?s=1400",
            "TED Radio Hour": "https://media.npr.org/images/podcasts/primary/icon_510298-c3b09c45c6ef5b6af87f0c5982d68c216cda43dc.jpg?s=1400"
        }
        
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

                        # Debug logging for image sources
                        logging.debug(f"Feed: {feed['name']}")
                        logging.debug(f"Media thumbnail: {entry.get('media_thumbnail', [{}])[0].get('url')}")
                        logging.debug(f"iTunes image: {entry.get('itunes_image', {}).get('href')}")
                        logging.debug(f"Entry image (getattr): {getattr(entry, 'image', {}).get('href')}")
                        logging.debug(f"Entry image (get): {entry.get('image', {}).get('href')}")
                        logging.debug(f"Feed iTunes image: {parsed.feed.get('itunes_image', {}).get('href')}")
                        logging.debug(f"Feed image (getattr): {getattr(parsed.feed, 'image', {}).get('href')}")
                        logging.debug(f"Feed image (get): {parsed.feed.get('image', {}).get('href')}")
                        
                        # Get image with enhanced fallback hierarchy
                        image = (
                            # Episode-specific images
                            entry.get('media_thumbnail', [{}])[0].get('url') or
                            entry.get('itunes_image', {}).get('href') or
                            getattr(entry, 'image', {}).get('href') or
                            entry.get('image', {}).get('href') or  # Additional check
                            
                            # Feed-level images
                            parsed.feed.get('itunes_image', {}).get('href') or
                            getattr(parsed.feed, 'image', {}).get('href') or
                            parsed.feed.get('image', {}).get('href') or  # Additional check
                            
                            # Custom fallback per podcast
                            self.custom_fallbacks.get(feed['name']) or
                            
                            # Generic fallback
                            self.generic_fallback
                        )
                        
                        logging.debug(f"Final image URL selected: {image}")
                        
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
