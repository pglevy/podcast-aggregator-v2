import express from 'express';
import * as path from 'path';
import { FeedManager } from './feed-manager';
import { TemplateEngine } from './template-engine';

export class PodcastServer {
  private app: express.Application;
  private feedManager: FeedManager;
  private templateEngine: TemplateEngine;
  private port: number;

  constructor(port: number = 5000) {
    this.port = port;
    this.app = express();
    this.feedManager = new FeedManager('feeds.json');
    this.templateEngine = new TemplateEngine(this.feedManager);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Static files
    this.app.use('/static', express.static(path.join(__dirname, '..', 'static')));
    
    // JSON parsing
    this.app.use(express.json());
    
    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Home page
    this.app.get('/', async (req, res) => {
      try {
        const episodes = await this.feedManager.getAllEpisodes();
        episodes.sort((a, b) => b.published - a.published);
        
        const html = await this.templateEngine.render('index', {
          episodes,
          title: 'Pod Force - Podcast Aggregator'
        });
        
        res.send(html);
      } catch (error) {
        console.error('Error rendering home page:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    // Episode detail page - use a simpler route pattern
    this.app.get('/episode/:guid', async (req, res) => {
      try {
        const { guid } = req.params;
        const decodedGuid = decodeURIComponent(guid);
        const episode = await this.feedManager.getEpisodeByGuid(decodedGuid);
        
        if (!episode) {
          res.status(404).send('Episode not found');
          return;
        }
        
        const html = await this.templateEngine.render('episode', {
          episode,
          title: `${episode.title} - Pod Force`
        });
        
        res.send(html);
      } catch (error) {
        console.error('Error rendering episode page:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    // API endpoint to refresh feeds
    this.app.post('/api/refresh', async (req, res) => {
      try {
        this.feedManager.clearCache();
        const episodes = await this.feedManager.getAllEpisodes();
        res.json({
          success: true,
          message: `Refreshed ${episodes.length} episodes`
        });
      } catch (error) {
        console.error('Error refreshing feeds:', error);
        res.status(500).json({
          success: false,
          message: 'Error refreshing feeds'
        });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.port, '0.0.0.0', () => {
        console.log(`🎧 Pod Force server running on http://0.0.0.0:${this.port}`);
        console.log(`📺 Preview available at: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
        resolve();
      });
      
      server.on('error', (error) => {
        console.error('❌ Server error:', error);
        reject(error);
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }
}