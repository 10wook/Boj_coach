#!/usr/bin/env node

const MCPServer = require('./lib/mcpServer');

async function main() {
  const server = new MCPServer();
  
  process.on('SIGINT', async () => {
    console.log('Shutting down MCP server...');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down MCP server...');
    process.exit(0);
  });

  try {
    await server.start();
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

main();