# Pod Force Podcast Aggregator

## Overview

Pod Force is a podcast aggregator application built with Flask that fetches and displays episodes from multiple podcast feeds. The application provides a clean, card-based interface for browsing recent episodes and includes audio playback functionality with progress tracking. This is a work-in-progress rewrite of the original Pod Force application.

## System Architecture

The application follows a simple Flask web application architecture with the following key characteristics:

- **Frontend**: Server-side rendered HTML templates using Jinja2 with Bootstrap for styling
- **Backend**: Flask web framework with Python
- **Data Layer**: JSON-based feed configuration with in-memory caching
- **Static Generation**: Flask-Frozen integration for generating static HTML files
- **Client-Side**: Vanilla JavaScript for audio player functionality

## Key Components

### Backend Components

**Flask Application (`app/app.py`)**
- Main web application with two routes: home page and episode detail page
- Custom template filter for date formatting
- Static file serving configuration

**Feed Manager (`app/feed_manager.py`)**
- Handles podcast feed parsing using the `feedparser` library
- Manages episode caching and date parsing
- Provides fallback images for podcast artwork
- Limits episodes per feed to prevent overwhelming the interface

**Static Site Generator (`app/build.py`)**
- Uses Flask-Frozen to generate static HTML files
- Automatically generates routes for all episodes
- Outputs to a `build/` directory for deployment

**Feed Converter (`app/convert_feeds.py`)**
- Utility for converting YAML feed subscriptions to JSON format
- Merges existing feeds with new ones

### Frontend Components

**Templates**
- `base.html`: Base template with Bootstrap dark theme and navigation
- `index.html`: Episode listing page with card-based layout
- `episode.html`: Individual episode page with audio player

**Static Assets**
- `custom.css`: Custom styling for episode cards and audio player
- `player.js`: JavaScript class for audio playback progress tracking

### Data Storage

**Feed Configuration (`feeds.json`)**
- JSON array containing podcast feed URLs and names
- Currently includes 12 different podcasts covering various topics
- Simple structure with `name` and `url` fields

## Data Flow

1. **Feed Loading**: Application loads podcast feeds from `feeds.json`
2. **Feed Parsing**: FeedManager fetches and parses RSS/XML feeds using feedparser
3. **Episode Caching**: Parsed episodes are cached in memory for performance
4. **Template Rendering**: Episodes are passed to Jinja2 templates for HTML generation
5. **Static Generation**: Flask-Frozen can generate static HTML files for deployment
6. **Client Interaction**: JavaScript handles audio playback and progress persistence

## External Dependencies

### Python Libraries
- **Flask**: Web framework for routing and templating
- **feedparser**: RSS/XML feed parsing
- **Flask-Frozen**: Static site generation
- **PyYAML**: YAML file processing (for feed conversion)

### Frontend Dependencies
- **Bootstrap 5.3**: CSS framework with dark theme
- **Bootstrap Icons**: Icon library via CDN
- **Feather Icons**: Alternative icon set for fallbacks

### External Services
- **Podcast RSS Feeds**: Various podcast hosting services (Simplecast, Megaphone, etc.)
- **CDN Services**: Image hosting and icon delivery

## Deployment Strategy

The application supports two deployment modes:

**Development Mode**
- Direct Flask development server (`python main.py`)
- Hot reloading enabled for rapid development

**Static Site Generation**
- Flask-Frozen generates static HTML files
- Output stored in `build/` directory
- Can be deployed to any static hosting service
- All episode pages are pre-generated for performance

## Changelog

- August 15, 2025. Complete refactor to Node.js/TypeScript with enhanced features
  - Migrated from Python/Flask to Node.js/TypeScript architecture
  - Added enhanced audio player with rewind/forward controls (10-second jumps)
  - Implemented modern Bootstrap dark theme with improved responsive design
  - Added auto-rebuild functionality with scheduled feed updates
  - Maintained all original functionality (feed aggregation, episode listing, static generation)
  - Enhanced progress tracking and keyboard shortcuts for audio player
- July 07, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.