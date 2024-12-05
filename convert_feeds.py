import yaml
import json

def convert_yaml_to_json():
    # Read existing JSON feeds
    with open('feeds.json', 'r') as f:
        existing_feeds = json.load(f)

    # Read YAML feeds
    with open('subscriptions.yml', 'r') as f:
        yaml_feeds = yaml.safe_load(f)

    # Convert YAML feeds to the same format as JSON feeds
    converted_feeds = [
        {
            "url": feed["url"],
            "name": feed["title"]
        }
        for feed in yaml_feeds
    ]

    # Combine existing and new feeds
    all_feeds = existing_feeds + converted_feeds

    # Write back to feeds.json with proper formatting
    with open('feeds.json', 'w') as f:
        json.dump(all_feeds, f, indent=4, ensure_ascii=False, sort_keys=True)

    print(f"Successfully converted and merged {len(yaml_feeds)} YAML feeds with {len(existing_feeds)} existing JSON feeds.")
    print(f"Total feeds in feeds.json: {len(all_feeds)}")

if __name__ == "__main__":
    convert_yaml_to_json()
