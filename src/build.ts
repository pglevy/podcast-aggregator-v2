import * as fs from 'fs-extra';
import * as path from 'path';
import { FeedManager } from './feed-manager';
import { TemplateEngine } from './template-engine';

export class StaticSiteBuilder {
  private feedManager: FeedManager;
  private templateEngine: TemplateEngine;
  private buildDir: string;

  constructor(buildDir: string = 'build') {
    this.buildDir = buildDir;
    this.feedManager = new FeedManager('feeds.json');
    this.templateEngine = new TemplateEngine(this.feedManager);
  }

  async build(): Promise<void> {
    console.log('🏗️  Starting static site build...');
    
    // Clean build directory
    await fs.emptyDir(this.buildDir);
    
    // Copy static assets
    await this.copyStaticAssets();
    
    // Build pages
    await this.buildHomePage();
    await this.buildEpisodePages();
    
    // Add .nojekyll file for GitHub Pages
    await fs.writeFile(path.join(this.buildDir, '.nojekyll'), '');
    
    console.log('✅ Static site build completed!');
  }

  private async copyStaticAssets(): Promise<void> {
    console.log('📁 Copying static assets...');
    const staticSrc = path.join(__dirname, '..', 'static');
    const staticDest = path.join(this.buildDir, 'static');
    
    if (await fs.pathExists(staticSrc)) {
      await fs.copy(staticSrc, staticDest);
    }
  }

  private async buildHomePage(): Promise<void> {
    console.log('🏠 Building home page...');
    const episodes = await this.feedManager.getAllEpisodes();
    episodes.sort((a, b) => b.published - a.published);
    
    let html = await this.templateEngine.render('index', {
      episodes,
      title: 'Pod Force - Podcast Aggregator'
    });
    
    // Fix episode links for static deployment
    html = this.fixEpisodeLinks(html);
    
    await fs.writeFile(path.join(this.buildDir, 'index.html'), html);
  }

  private async buildEpisodePages(): Promise<void> {
    console.log('🎧 Building episode pages...');
    const episodes = await this.feedManager.getAllEpisodes();
    
    await fs.ensureDir(path.join(this.buildDir, 'episode'));
    
    for (const episode of episodes) {
      const html = await this.templateEngine.render('episode', {
        episode,
        title: `${episode.title} - Pod Force`
      });
      
      // Use encoded GUID for filename to handle special characters
      const filename = encodeURIComponent(episode.guid).replace(/%/g, '_');
      await fs.writeFile(
        path.join(this.buildDir, 'episode', `${filename}.html`),
        html
      );
    }
    
    console.log(`Built ${episodes.length} episode pages`);
  }

  private fixEpisodeLinks(html: string): string {
    // Convert dynamic episode URLs to static file paths
    // Replace /episode/{guid} with /episode/{encoded_guid}.html
    return html.replace(/\/episode\/([^"'\s]+)/g, (match, guid) => {
      const filename = encodeURIComponent(decodeURIComponent(guid)).replace(/%/g, '_');
      return `/episode/${filename}.html`;
    });
  }
}

async function main() {
  const builder = new StaticSiteBuilder();
  await builder.build();
}

if (require.main === module) {
  main().catch(console.error);
}