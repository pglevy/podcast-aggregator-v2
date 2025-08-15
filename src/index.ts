import { PodcastServer } from './server';

async function main() {
  const port = parseInt(process.env.PORT || '5000');
  const server = new PodcastServer(port);
  
  try {
    await server.start();
    console.log('✅ Server started successfully! Press Ctrl+C to stop.');
    
    // Keep the process alive
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}