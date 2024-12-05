from flask_frozen import Freezer
from app import app, feed_manager

freezer = Freezer(app)

@freezer.register_generator
def episode():
    episodes = feed_manager.get_all_episodes()
    for episode in episodes:
        yield {'guid': episode['guid']}

if __name__ == '__main__':
    freezer.freeze()
