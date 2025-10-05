// MCP server (StdIO) — stdout에는 프로토콜 프레임만, 로그는 stderr로만 출력
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/transports/stdio';
import axios from 'axios';

// 안전한 로깅 (stdout 사용 금지)
function log(...args) {
  try { process.stderr.write(args.join(' ') + '\n'); } catch (_) {}
}

async function main() {
  const server = new Server({ name: 'boj-coach', version: '1.0.0' });
  const transport = new StdioServerTransport();

  // 툴: 사용자 요약 조회
  server.tool('get_user', {
    description: 'solved.ac 기반 사용자 요약 조회',
    inputSchema: {
      type: 'object',
      properties: { username: { type: 'string' } },
      required: ['username']
    }
  }, async ({ username }) => {
    const baseUrl = process.env.BOJ_COACH_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/user/${encodeURIComponent(username)}`;
    const { data } = await axios.get(url, { timeout: 10000 });
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  });

  // 툴: 태그/레벨 통계
  server.tool('get_user_stats', {
    description: '사용자의 태그/레벨 통계 조회',
    inputSchema: {
      type: 'object',
      properties: { username: { type: 'string' } },
      required: ['username']
    }
  }, async ({ username }) => {
    const baseUrl = process.env.BOJ_COACH_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/user/${encodeURIComponent(username)}/stats`;
    const { data } = await axios.get(url, { timeout: 10000 });
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  });

  // 에러 핸들링: 항상 MCP 포맷으로 반환
  server.setRequestErrorHandler((err) => {
    log('MCP Error:', err && err.stack ? err.stack : String(err));
    return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: String(err) }) }] };
  });

  await server.connect(transport);
  // 절대 console.log 사용 금지
}

main().catch((e) => {
  log('Fatal:', e && e.stack ? e.stack : String(e));
  process.exit(1);
});


