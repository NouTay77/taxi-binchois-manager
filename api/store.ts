// =============== STORE.TS (Vercel API) CORRIGÉ ===============
import Redis from 'ioredis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createRedisConnection() {
  return new Redis(process.env.REDIS_URL || '', {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.REDIS_URL) {
    return res.status(503).json({ success: false, error: 'REDIS_URL not configured' });
  }

  const redis = createRedisConnection();

  try {
    const action = req.query.action as string;
    const sessionID = req.query.sessionID as string;

    let bodyData: any = {};
    if (['POST', 'PUT', 'DELETE'].includes(req.method || '')) {
      try {
        if (typeof req.body === 'string') {
          bodyData = JSON.parse(req.body.trim());
        } else if (Buffer.isBuffer(req.body)) {
          bodyData = JSON.parse(req.body.toString().trim());
        } else if (req.body && typeof req.body === 'object') {
          bodyData = req.body;
        }
      } catch (e) {
        console.error('JSON parse error:', e);
        bodyData = {};
      }
    }

    // ✅ Support tableau brut envoyé par l'ancien SDK
    if (Array.isArray(bodyData)) {
      bodyData = { data: bodyData };
    }

    // GET
    if (req.method === 'GET') {
      if (sessionID) {
        const sessionData = await redis.get(`session:${sessionID}`);
        if (!sessionData) return res.status(404).json({ success: false, error: 'Session not found' });
        return res.status(200).json({ success: true, user: JSON.parse(sessionData) });
      }

      const data = await redis.get('app_data');
      return res.status(200).json({
        success: true,
        data: data ? JSON.parse(data) : []
      });
    }

    // POST
    if (req.method === 'POST') {
      if (action === 'create_session') {
        const { user } = bodyData;
        if (!user?.sessionID) return res.status(400).json({ success: false, error: 'Missing user or sessionID' });
        await redis.set(`session:${user.sessionID}`, JSON.stringify(user), 'EX', 2592000);
        return res.status(200).json({ success: true, sessionID: user.sessionID });
      }

      if (action === 'delete_session') {
        const { sessionID: delSessionID } = bodyData;
        if (!delSessionID) return res.status(400).json({ success: false, error: 'Missing sessionID' });
        await redis.del(`session:${delSessionID}`);
        return res.status(200).json({ success: true });
      }

      // Sauvegarde des données de l'app
      const { data } = bodyData;
      if (!data) return res.status(400).json({ success: false, error: 'Missing data' });

      await redis.set('app_data', JSON.stringify(data), 'EX', 86400 * 30);
      return res.status(200).json({ success: true });
    }

    // PUT / DELETE (legacy)
    // ... (gardé tel quel pour compatibilité)

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Store API error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  } finally {
    if (redis) await redis.quit();
  }
}