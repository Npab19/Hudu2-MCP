#!/usr/bin/env node

import dotenv from 'dotenv';
import { HuduMcpServer } from './server.js';
import { HuduHttpServer } from './http-server.js';
import { HuduConfigSchema } from './types.js';

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Validate configuration
    const config = HuduConfigSchema.parse({
      baseUrl: process.env.HUDU_BASE_URL || '',
      apiKey: process.env.HUDU_API_KEY || '',
      timeout: process.env.HUDU_TIMEOUT ? parseInt(process.env.HUDU_TIMEOUT) : undefined,
    });

    // Determine if we should run in HTTP mode (for Docker) or stdio mode
    const useHttp = process.env.MCP_SERVER_PORT || process.env.NODE_ENV === 'production';
    
    if (useHttp) {
      // HTTP server mode (for Docker/production)
      const port = parseInt(process.env.MCP_SERVER_PORT || '3000');
      const httpServer = new HuduHttpServer(config, port);
      await httpServer.start();
      
      // Keep the process alive
      process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        process.exit(0);
      });
    } else {
      // Stdio mode (traditional MCP)
      const server = new HuduMcpServer(config);
      await server.run();
    }
  } catch (error) {
    console.error('Failed to start Hudu MCP server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});