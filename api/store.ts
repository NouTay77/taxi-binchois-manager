// Redis Data Store API
import Redis from 'ioredis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Crée une NOUVELLE connexion Redis pour chaque requête (stateless Vercel)
function createRedisConnection() {
  return new Redis(process.env.REDIS_URL || '', {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryStrategy: (times) => Math.min(times * 50, 500),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Vérifier que REDIS_URL est configuré
  if (!process.env.REDIS_URL) {
    return res.status(503).json({
      success: false,
      error: 'REDIS_URL not configured - database not available'
    });
  }

  const redis = createRedisConnection();

  try {
    const { action, sessionID } = req.query;

    if (req.method === 'GET') {
      // Récupérer une session utilisateur
      if (sessionID) {
        const sessionData = await redis.get(`session:${sessionID}`);
        await redis.quit();
        if (!sessionData) {
          return res.status(404).json({
            success: false,
            error: 'Session not found or expired'
          });
        }
        return res.status(200).json({
          success: true,
          user: JSON.parse(sessionData)
        });
      }
      
      // Récupérer toutes les données
      const data = await redis.get('app_data');
      await redis.quit();
      return res.status(200).json({
        success: true,
        data: data ? JSON.parse(data) : []
      });
    }

    if (req.method === 'POST') {
      // Créer une nouvelle session utilisateur
      if (action === 'create_session') {
        const { user } = req.body;
        if (!user || !user.sessionID) {
          await redis.quit();
          return res.status(400).json({ success: false, error: 'Missing user or sessionID' });
        }
        
        // Sauvegarder la session avec TTL de 30j (2592000 secondes)
        await redis.set(`session:${user.sessionID}`, JSON.stringify(user), 'EX', 2592000);
        await redis.quit();
        
        return res.status(200).json({
          success: true,
          message: 'Session created',
          sessionID: user.sessionID
        });
      }
      
      // Supprimer une session utilisateur
      if (action === 'delete_session') {
        const { sessionID: delSessionID } = req.body;
        if (!delSessionID) {
          await redis.quit();
          return res.status(400).json({ success: false, error: 'Missing sessionID' });
        }
        
        await redis.del(`session:${delSessionID}`);
        await redis.quit();
        
        return res.status(200).json({
          success: true,
          message: 'Session deleted'
        });
      }
      
      // Sauvegarder/mettre à jour les données
      const { data } = req.body;
      if (!data) {
        await redis.quit();
        return res.status(400).json({ success: false, error: 'Missing data' });
      }
      
      await redis.set('app_data', JSON.stringify(data), 'EX', 86400 * 30); // 30 jours
      await redis.quit();
      
      return res.status(200).json({
        success: true,
        message: 'Data saved successfully'
      });
    }

    if (req.method === 'PUT') {
      // Ajouter/modifier un item
      const { item, type } = req.body;
      if (!item || !type) {
        await redis.quit();
        return res.status(400).json({ success: false, error: 'Missing item or type' });
      }

      const data = await redis.get('app_data');
      const allData = data ? JSON.parse(data) : [];
      
      const index = allData.findIndex((d: any) => d.type === type && d.__backendId === item.__backendId);
      if (index >= 0) {
        allData[index] = item;
      } else {
        allData.push(item);
      }

      await redis.set('app_data', JSON.stringify(allData), 'EX', 86400 * 30);
      await redis.quit();

      return res.status(200).json({
        success: true,
        item
      });
    }

    if (req.method === 'DELETE') {
      // Supprimer un item
      const { id, type } = req.body;
      if (!id || !type) {
        await redis.quit();
        return res.status(400).json({ success: false, error: 'Missing id or type' });
      }

      const data = await redis.get('app_data');
      const allData = data ? JSON.parse(data) : [];
      
      const filtered = allData.filter((d: any) => !(d.type === type && d.__backendId === id));
      await redis.set('app_data', JSON.stringify(filtered), 'EX', 86400 * 30);
      await redis.quit();

      return res.status(200).json({
        success: true,
        message: 'Item deleted'
      });
    }

    await redis.quit();
    res.status(400).json({ success: false, error: 'Invalid method' });
  } catch (err: any) {
    try { await redis.quit(); } catch (e) {}
    console.error('Store API error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
}
