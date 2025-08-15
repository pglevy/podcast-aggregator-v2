# Pod Force Podcast Aggregator

## Overview

Pod Force is a podcast aggregator application built with Node.js/TypeScript that fetches and displays episodes from multiple podcast feeds. The application provides a clean, card-based interface for browsing recent episodes and includes audio playback functionality with progress tracking and enhanced controls.

## System Architecture

The application follows a modern Node.js/TypeScript architecture with the following key characteristics:

- **Frontend**: Server-side rendered HTML templates using Handlebars with Bootstrap dark theme
- **Backend**: Express.js web framework with TypeScript
- **Data Layer**: JSON-based feed configuration with in-memory caching
- **Static Generation**: TypeScript-based build system for generating static HTML files
- **Client-Side**: Enhanced JavaScript with modern audio player controls and keyboard shortcuts

## Key Components

### Backend Components

**Express Server (`src/server.ts`)**
- Main web application with routes for home page and episode detail pages
- Static file serving configuration
- Request logging middleware

**Feed Manager (`src/feed-manager.ts`)**
- Handles podcast feed parsing using the `rss-parser` library
- Manages episode caching and date parsing
- Provides fallback images for podcast artwork
- Limits episodes per feed to prevent overwhelming the interface

**Template Engine (`src/template-engine.ts`)**
- Handlebars-based template rendering system
- Date formatting helpers and utilities
- Episode and index page rendering

**Static Site Generator (`src/build.ts`)**
- TypeScript-based build system for generating static HTML files
- Automatically generates routes for all episodes
- Outputs to a `build/` directory for deployment

### Frontend Components

**Templates**
- `base.hbs`: Base template with Bootstrap dark theme and navigation
- `index.hbs`: Episode listing page with card-based layout
- `episode.hbs`: Individual episode page with enhanced audio player

**Static Assets**
- `main.css`: Modern CSS with CSS variables and dark theme
- `custom.css`: Additional styling for episode cards and audio player
- `main.js`: Enhanced JavaScript with toast notifications and audio controls

### Data Storage

**Feed Configuration (`feeds.json`)**
- JSON array containing podcast feed URLs and names
- Currently includes 12 different podcasts covering various topics
- Simple structure with `name` and `url` fields

## Data Flow

1. **Feed Loading**: Application loads podcast feeds from `feeds.json`
2. **Feed Parsing**: FeedManager fetches and parses RSS/XML feeds using rss-parser
3. **Episode Caching**: Parsed episodes are cached in memory for performance
4. **Template Rendering**: Episodes are passed to Handlebars templates for HTML generation
5. **Static Generation**: TypeScript build system can generate static HTML files for deployment
6. **Client Interaction**: Enhanced JavaScript handles audio playback, progress persistence, and user interactions

## External Dependencies

### Node.js/TypeScript Libraries
- **Express**: Web framework for routing and middleware
- **rss-parser**: RSS/XML feed parsing
- **Handlebars**: Template engine for HTML generation
- **TypeScript**: Type-safe JavaScript development
- **chokidar**: File watching for auto-rebuild functionality
- **node-cron**: Scheduled task management

### Frontend Dependencies
- **Bootstrap 5.3**: CSS framework with dark theme
- **Bootstrap Icons**: Icon library via CDN
- **Custom CSS**: Enhanced styling with CSS variables and dark theme

### External Services
- **Podcast RSS Feeds**: Various podcast hosting services (Simplecast, Megaphone, etc.)
- **CDN Services**: Image hosting and icon delivery

## Deployment Strategy

The application supports multiple deployment modes:

**Development Mode**
- TypeScript development server with auto-compilation
- Hot reloading enabled for rapid development
- Auto-rebuild watcher with scheduled feed updates

**Static Site Generation**
- TypeScript build system generates static HTML files
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