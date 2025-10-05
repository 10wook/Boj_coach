// MCP over HTTP + SSE bridge for ChatGPT "신규 커넥터" URL 입력용
import http from 'node:http';
import url from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse';
import axios from 'axios';

const PORT = process.env.MCP_SSE_PORT ? Number(process.env.MCP_SSE_PORT) : 7400;
const BASE_URL = process.env.BOJ_COACH_BASE_URL || 'http://localhost:3000';

function log(...a) { try { process.stderr.write(a.join(' ') + '\n'); } catch (_) {} }

// MCP server logic (same tools as stdio server)
function buildMcpServer() {
  const server = new Server({ name: 'boj-coach-sse', version: '1.0.0' });

  server.tool('get_user', {
    description: 'solved.ac 기반 사용자 요약 조회',
    inputSchema: { type: 'object', properties: { username: { type: 'string' } }, required: ['username'] }
  }, async ({ username }) => {
    const { data } = await axios.get(`${BASE_URL}/api/user/${encodeURIComponent(username)}`, { timeout: 10000 });
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  });

  server.tool('get_user_stats', {
    description: '사용자의 태그/레벨 통계 조회',
    inputSchema: { type: 'object', properties: { username: { type: 'string' } }, required: ['username'] }
  }, async ({ username }) => {
    const { data } = await axios.get(`${BASE_URL}/api/user/${encodeURIComponent(username)}/stats`, { timeout: 10000 });
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  });

  server.setRequestErrorHandler((err) => {
    log('MCP Error:', err && err.stack ? err.stack : String(err));
    return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: String(err) }) }] };
  });

  return server;
}

// Very small HTTP server hosting SSE endpoint and POST receiver
const httpServer = http.createServer(async (req, res) => {
  try {
    const parsed = url.parse(req.url || '/', true);
    if (parsed.pathname !== '/sse') {
      res.writeHead(404).end('Not Found');
      return;
    }

    // Create a fresh MCP server per connection
    const mcpServer = buildMcpServer();

    if (req.method === 'GET') {
      const transport = new SSEServerTransport('/sse', res);
      await mcpServer.connect(transport);
      await transport.start();
      return; // keep-alive
    }

    if (req.method === 'POST') {
      // Body will be read by transport
      const transport = new SSEServerTransport('/sse', res);
      // do not connect again here; handlePostMessage just validates and processes message
      await transport.handlePostMessage(req, res);
      return;
    }

    res.writeHead(405).end('Method Not Allowed');
  } catch (err) {
    log('HTTP Error:', err && err.stack ? err.stack : String(err));
    try { res.writeHead(500).end('Internal Error'); } catch (_) {}
  }
});

httpServer.listen(PORT, () => {
  log(`[boj-coach] MCP SSE server listening on http://localhost:${PORT}/sse`);
});


