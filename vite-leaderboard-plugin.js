import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'leaderboard.json');
const MAX_STORED = 10;
const MAX_RETURNED = 10;
const MAX_NAME_LEN = 20;

function readBoard() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBoard(list) {
  fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2), 'utf-8');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > 10_000) req.destroy(); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// Local-dev-only leaderboard API — persists to leaderboard.json on disk.
// Only active while running the Vite dev server (`npm run dev`); a static
// production build has no server to back this endpoint.
export default function leaderboardPlugin() {
  return {
    name: 'contra-leaderboard',
    configureServer(server) {
      server.middlewares.use('/api/leaderboard', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method === 'GET') {
          const board = readBoard().sort((a, b) => b.score - a.score).slice(0, MAX_RETURNED);
          res.end(JSON.stringify(board));
          return;
        }
        if (req.method === 'POST') {
          try {
            const body = await readJsonBody(req);
            const name = String(body.name ?? '').trim().slice(0, MAX_NAME_LEN) || 'ẨN DANH';
            const score = Number(body.score);
            if (!Number.isFinite(score) || score < 0) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'invalid score' }));
              return;
            }
            const board = readBoard();
            board.push({ name, score: Math.floor(score), date: new Date().toISOString() });
            board.sort((a, b) => b.score - a.score);
            writeBoard(board.slice(0, MAX_STORED));
            res.end(JSON.stringify(board.slice(0, MAX_RETURNED)));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'bad request' }));
          }
          return;
        }
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'method not allowed' }));
      });
    },
  };
}
