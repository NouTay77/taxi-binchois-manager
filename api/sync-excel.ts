// Synchronisation Redis - Données et Excel
import Redis from 'ioredis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const redis = new Redis(process.env.REDIS_URL as string, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  enableOfflineQueue: false,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Récupérer toutes les données depuis Redis
    if (req.method === 'GET') {
      try {
        const data = await redis.get('taxi_app_data');
        const appData = data ? JSON.parse(data) : [];
        
        return res.status(200).json(appData);
      } catch (err) {
        console.error('Redis GET error:', err);
        return res.status(200).json([]); // Retourner vide si erreur
      }
    }

    // POST - Sauvegarder les données dans Redis
    if (req.method === 'POST') {
      try {
        const { data } = req.body;
        
        if (!Array.isArray(data)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Data must be an array' 
          });
        }

        // Sauvegarder dans Redis avec expiration 30 jours
        await redis.set(
          'taxi_app_data',
          JSON.stringify(data),
          'EX',
          2592000
        );

        return res.status(200).json({
          success: true,
          message: 'Data synchronized',
          count: data.length
        });
      } catch (err: any) {
        console.error('Redis POST error:', err);
        return res.status(500).json({
          success: false,
          error: err.message || 'Failed to sync data'
        });
      }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}