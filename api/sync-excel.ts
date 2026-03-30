import Redis from 'ioredis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Connexion automatique via la variable REDIS_URL de ta capture d'écran
const redis = new Redis(process.env.REDIS_URL as string);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Headers pour le téléphone
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const data = await redis.get('taxi_data');
      return res.status(200).json(data ? JSON.parse(data) : []);
    }

    if (req.method === 'POST') {
      const data = req.body;
      await redis.set('taxi_data', JSON.stringify(data));
      return res.status(200).json({ success: true });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}