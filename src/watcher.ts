import * as chokidar from 'chokidar';
import * as cron from 'node-cron';
import { StaticSiteBuilder } from './build';
import { FeedManager } from './feed-manager';

export class AutoRebuildWatcher {
  private builder: StaticSiteBuilder;
  private feedManager: FeedManager;
  private isBuilding: boolean = false;

  constructor() {
    this.builder = new StaticSiteBuilder();
    this.feedManager = new FeedManager('feeds.json');
  }

  async startWatching(): Promise<void> {
    console.log('👀 Starting auto-rebuild watcher...');
    
    // Watch for template and static file changes
    this.watchFileChanges();
    
    // Schedule periodic feed updates
    this.scheduleFeedUpdates();
    
    // Initial build
    await this.rebuild('Initial build');
  }

  private watchFileChanges(): void {
    const watcher = chokidar.watch([
      'templates/**/*.hbs',
      'static/**/*',
      'feeds.json'
    ], {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });

    watcher
      .on('change', (path) => {
        console.log(`📝 File changed: ${path}`);
        this.rebuild(`File change: ${path}`);
      })
      .on('add', (path) => {
        console.log(`➕ File added: ${path}`);
        this.rebuild(`File added: ${path}`);
      })
      .on('unlink', (path) => {
        console.log(`🗑️  File removed: ${path}`);
        this.rebuild(`File removed: ${path}`);
      });
  }

  private scheduleFeedUpdates(): void {
    // Update feeds every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log('⏰ Scheduled feed update...');
      this.feedManager.clearCache();
      await this.rebuild('Scheduled feed update');
    });

    // Full rebuild daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🌙 Daily rebuild...');
      this.feedManager.clearCache();
      await this.rebuild('Daily rebuild');
    });

    console.log('📅 Scheduled automatic updates:');
    console.log('  - Feed updates: Every 30 minutes');
    console.log('  - Full rebuild: Daily at 2:00 AM');
  }

  private async rebuild(reason: string): Promise<void> {
    if (this.isBuilding) {
      console.log('⏳ Build already in progress, skipping...');
      return;
    }

    this.isBuilding = true;
    
    try {
      console.log(`🔄 Rebuilding site (${reason})...`);
      const startTime = Date.now();
      
      await this.builder.build();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Rebuild completed in ${duration}ms`);
    } catch (error) {
      console.error('❌ Build failed:', error);
    } finally {
      this.isBuilding = false;
    }
  }
}

async function main() {
  const watcher = new AutoRebuildWatcher();
  await watcher.startWatching();
  
  // Keep the process running
  console.log('🚀 Auto-rebuild watcher is running. Press Ctrl+C to stop.');
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping watcher...');
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(console.error);
}