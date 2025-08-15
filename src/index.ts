import { PodcastServer } from './server';

async function main() {
  const port = parseInt(process.env.PORT || '5000');
  console.log(`🚀 Starting Pod Force server on port ${port}...`);
  
  const server = new PodcastServer(port);
  
  try {
    await server.start();
    console.log('✅ Server started successfully! Press Ctrl+C to stop.');
    console.log(`🌐 Access your app at: http://0.0.0.0:${port}`);
    
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
    console.error('❌ Failed to start server:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}