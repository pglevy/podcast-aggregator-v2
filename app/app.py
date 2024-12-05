import os
from flask import Flask, render_template, url_for
from .feed_manager import FeedManager
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "dev_key"

@app.template_filter('format_date')
def format_date(timestamp):
    """Convert timestamp to human readable date."""
    date = datetime.fromtimestamp(timestamp)
    today = datetime.now()
    
    # If it's today
    if date.date() == today.date():
        return f"Today at {date.strftime('%-I:%M %p')}"
    # If it's yesterday
    elif date.date() == today.date().replace(day=today.day-1):
        return f"Yesterday at {date.strftime('%-I:%M %p')}"
    # If it's this year
    elif date.year == today.year:
        return date.strftime('%B %-d at %-I:%M %p')
    # If it's a different year
    else:
        return date.strftime('%B %-d, %Y at %-I:%M %p')

feed_manager = FeedManager('feeds.json')

@app.route('/')
def index():
    episodes = feed_manager.get_all_episodes()
    episodes.sort(key=lambda x: x['published'], reverse=True)
    return render_template('index.html', episodes=episodes)

@app.route('/episode/<path:guid>')
def episode(guid):
    episode = feed_manager.get_episode_by_guid(guid)
    if episode:
        return render_template('episode.html', episode=episode)
    return "Episode not found", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
