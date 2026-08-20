// Vercel Serverless Function — this is what actually backs /api/leaderboard
// once the site is deployed (a static host has no server to run
// vite-leaderboard-plugin.js, and even a serverless function's local disk
// isn't durable, so scores live in Upstash Redis instead of a JSON file).
//
// Requires a Redis database connected to the Vercel project (Vercel
// Dashboard → Project → Storage → Create Database → Upstash Redis, or any
// standalone Upstash instance). That integration sets KV_REST_API_URL /
// KV_REST_API_TOKEN automatically; UPSTASH_REDIS_REST_URL / _TOKEN are
// accepted too for a manually-connected Upstash database.
import { Redis } from '@upstash/redis';

const KEY = 'contra:leaderboard';
const MAX_STORED = 200;
const MAX_RETURNED = 20;
const MAX_NAME_LEN = 20;

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function parseEntries(members) {
  return members
    .map(m => { try { return JSON.parse(m); } catch { return null; } })
    .filter(Boolean);
}

export default async function handler(req, res) {
  const redis = getRedis();
  if (!redis) {
    if (req.method === 'GET') return res.status(200).json([]);
    return res.status(503).json({ error: 'leaderboard database not configured on this deployment' });
  }

  if (req.method === 'GET') {
    const members = await redis.zrange(KEY, 0, MAX_RETURNED - 1, { rev: true });
    return res.status(200).json(parseEntries(members));
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const name = String(body.name ?? '').trim().slice(0, MAX_NAME_LEN) || 'ẨN DANH';
    const score = Number(body.score);
    if (!Number.isFinite(score) || score < 0) {
      return res.status(400).json({ error: 'invalid score' });
    }
    const entry = { name, score: Math.floor(score), date: new Date().toISOString() };
    await redis.zadd(KEY, { score: entry.score, member: JSON.stringify(entry) });

    const count = await redis.zcard(KEY);
    if (count > MAX_STORED) {
      await redis.zremrangebyrank(KEY, 0, count - MAX_STORED - 1);
    }

    const members = await redis.zrange(KEY, 0, MAX_RETURNED - 1, { rev: true });
    return res.status(200).json(parseEntries(members));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
