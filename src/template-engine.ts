import * as Handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';
import { TemplateData } from './types';
import { FeedManager } from './feed-manager';

export class TemplateEngine {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private feedManager: FeedManager;
  private partialsRegistered = false;

  constructor(feedManager: FeedManager) {
    this.feedManager = feedManager;
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (timestamp: number) => {
      return this.feedManager.formatDate(timestamp);
    });

    // URL encoding helper
    Handlebars.registerHelper('encodeURIComponent', (str: string) => {
      return encodeURIComponent(str);
    });

    // Truncate text helper
    Handlebars.registerHelper('truncate', (text: string, length: number) => {
      if (!text || text.length <= length) return text;
      return text.substring(0, length) + '...';
    });

    // Conditional helper
    Handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    // Duration formatting helper
    Handlebars.registerHelper('formatDuration', (duration: string) => {
      if (!duration) return '';
      
      // Handle various duration formats
      if (duration.includes(':')) {
        return duration; // Already formatted (e.g., "1:23:45")
      }
      
      // Convert seconds to HH:MM:SS or MM:SS
      const seconds = parseInt(duration);
      if (isNaN(seconds)) return duration;
      
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
      }
    });
  }

  private async registerPartials(): Promise<void> {
    try {
      const baseTemplatePath = path.join(__dirname, '..', 'templates', 'base.hbs');
      const baseTemplateContent = await fs.readFile(baseTemplatePath, 'utf-8');
      Handlebars.registerPartial('base', baseTemplateContent);
      console.log('Registered base partial successfully');
    } catch (error) {
      console.error('Error registering base partial:', error);
    }
  }

  async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templates.has(templateName)) {
      return this.templates.get(templateName)!;
    }

    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateContent);
    
    this.templates.set(templateName, compiledTemplate);
    return compiledTemplate;
  }

  async render(templateName: string, data: TemplateData): Promise<string> {
    if (!this.partialsRegistered) {
      await this.registerPartials();
      this.partialsRegistered = true;
    }
    const template = await this.loadTemplate(templateName);
    return template(data);
  }

  async renderToFile(templateName: string, data: TemplateData, outputPath: string): Promise<void> {
    const html = await this.render(templateName, data);
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, html, 'utf-8');
  }
}