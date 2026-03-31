// Synchronisation Redis - Données
import Redis from 'ioredis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Redis est OBLIGATOIRE
const redis = new Redis(process.env.REDIS_URL || '', {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  enableOfflineQueue: false,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis connecté');
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

  // Vérifier que REDIS_URL est configuré
  if (!process.env.REDIS_URL) {
    return res.status(503).json({
      success: false,
      error: 'REDIS_URL not configured - database not available'
    });
  }

  try {
    // GET - Récupérer toutes les données depuis Redis (OBLIGATOIRE)
    if (req.method === 'GET') {
      try {
        const data = await redis.get('taxi_app_data');
        const appData = data ? JSON.parse(data) : [];
        return res.status(200).json(appData);
      } catch (err: any) {
        console.error('Redis GET error:', err);
        return res.status(503).json({
          success: false,
          error: 'Database read error: ' + err.message
        });
      }
    }

    // POST - Sauvegarder les données dans Redis (OBLIGATOIRE)
    if (req.method === 'POST') {
      try {
        // Le body peut être directement un array ou un string JSON
        let data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        
        if (Array.isArray(data)) {
          // C'est directement un array
          data = data;
        } else if (data?.data && Array.isArray(data.data)) {
          // C'est un objet avec propriété data
          data = data.data;
        } else {
          return res.status(400).json({
            success: false,
            error: 'Invalid data format - expected array'
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
        return res.status(503).json({
          success: false,
          error: 'Database write error: ' + err.message
        });
      }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(503).json({
      success: false,
      error: error.message || 'Database error'
    });
  }
}