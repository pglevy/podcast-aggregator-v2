
from flask_frozen import Freezer
from .app import app, feed_manager
import os

# Get path to root build directory
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
build_dir = os.path.join(root_dir, 'build')

# Configure Freezer to use root build directory
freezer = Freezer(app, with_static_files=True, with_no_argument_rules=False)
app.config['FREEZER_DESTINATION'] = build_dir

@freezer.register_generator
def episode():
    episodes = feed_manager.get_all_episodes()
    for episode in episodes:
        yield {'guid': episode['guid']}

if __name__ == '__main__':
    freezer.freeze()
