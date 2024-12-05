import json
import feedparser
from datetime import datetime
from urllib.parse import quote
import logging

logging.basicConfig(level=logging.DEBUG)

class FeedManager:
    def __init__(self, feeds_file):
        self.feeds_file = feeds_file
        self.episodes_cache = None
        
    def load_feeds(self):
        with open(self.feeds_file) as f:
            return json.load(f)
            
    def get_all_episodes(self):
        if self.episodes_cache:
            return self.episodes_cache
            
        episodes = []
        feeds = self.load_feeds()
        
        for feed in feeds:
            try:
                parsed = feedparser.parse(feed['url'])
                for entry in parsed.entries:
                    episode = {
                        'title': entry.title,
                        'description': entry.description,
                        'published': datetime.strptime(entry.published, '%a, %d %b %Y %H:%M:%S %z').timestamp(),
                        'audio_url': next((link.href for link in entry.links if 'audio' in link.type), None),
                        'image': getattr(parsed.feed, 'image', {}).get('href', ''),
                        'podcast_title': parsed.feed.title,
                        'guid': quote(entry.guid, safe='')
                    }
                    episodes.append(episode)
            except Exception as e:
                logging.error(f"Error processing feed {feed['url']}: {str(e)}")
                
        self.episodes_cache = episodes
        return episodes
        
    def get_episode_by_guid(self, guid):
        episodes = self.get_all_episodes()
        return next((ep for ep in episodes if ep['guid'] == guid), None)
