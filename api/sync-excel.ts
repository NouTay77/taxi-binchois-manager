// Synchronisation Redis - Données
import Redis from 'ioredis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Crée une NOUVELLE connexion Redis pour chaque requête (stateless Vercel)
function createRedisConnection() {
  return new Redis(process.env.REDIS_URL || '', {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    connectTimeout: 15000,
    commandTimeout: 10000,
    maxReconnectTime: 10000,
    retryStrategy: (times) => {
      if (times > 5) return null;
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true, // Retarder la connexion pour la gérer correctement
    keepAlive: 0, // Pas de keep-alive sur Vercel (éphémère)
    family: 4, // IPv4 uniquement pour éviter les problèmes DNS
  });
}

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

  // Créer une nouvelle connexion Redis pour cette requête
  const redis = createRedisConnection();

  try {
    // Attendre que la connexion soit établie avec timeout
    const pingPromise = redis.ping();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis connection timeout')), 12000)
    );
    
    await Promise.race([pingPromise, timeoutPromise]);

    // GET - Récupérer toutes les données depuis Redis
    if (req.method === 'GET') {
      const data = await redis.get('taxi_app_data');
      const appData = data ? JSON.parse(data) : [];
      await redis.quit();
      return res.status(200).json(appData);
    }

    // POST - Sauvegarder les données dans Redis
    if (req.method === 'POST') {
      // Le body peut être directement un array ou un string JSON
      let data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      if (Array.isArray(data)) {
        // C'est directement un array
        data = data;
      } else if (data?.data && Array.isArray(data.data)) {
        // C'est un objet avec propriété data
        data = data.data;
      } else {
        await redis.quit();
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

      await redis.quit();
      return res.status(200).json({
        success: true,
        message: 'Data synchronized',
        count: data.length
      });
    }

    await redis.quit();
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    try { await redis.quit(); } catch (e) {}
    console.error('API error:', error);
    return res.status(503).json({
      success: false,
      error: error.message || 'Database error'
    });
  }
}