import os
from flask import Flask, render_template, url_for
from feed_manager import FeedManager

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "dev_key"

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
