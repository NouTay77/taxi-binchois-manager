// Redis Data Store API
import Redis from 'ioredis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Crée une NOUVELLE connexion Redis pour chaque requête (stateless Vercel)
function createRedisConnection() {
  return new Redis(process.env.REDIS_URL || '', {
    maxRetriesPerRequest: 3, // On limite les essais pour éviter de bloquer Vercel
    enableOfflineQueue: true, // IMPORTANT : On autorise la file d'attente
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

  // Vérifier que REDIS_URL est configuré
  if (!process.env.REDIS_URL) {
    return res.status(503).json({
      success: false,
      error: 'REDIS_URL not configured - database not available'
    });
  }

  const redis = createRedisConnection();

  try {
    const action = req.query.action as string;
    const sessionID = req.query.sessionID as string;
    
    let bodyData: any = {};
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      try {
        if (req.body) {
          if (typeof req.body === 'string') {
            bodyData = JSON.parse(req.body.trim());
          } else if (Buffer.isBuffer(req.body)) {
            bodyData = JSON.parse(req.body.toString().trim());
          } else if (typeof req.body === 'object') {
            bodyData = req.body;
          }
        }
      } catch (e) {
        console.error('JSON Parse error:', e);
        bodyData = {};
      }
    }

    if (req.method === 'GET') {
      // Récupérer une session utilisateur
      if (sessionID) {
        const sessionData = await redis.get(`session:${sessionID}`);
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
      return res.status(200).json({
        success: true,
        data: data ? JSON.parse(data) : []
      });
    }

    if (req.method === 'POST') {
      // Créer une nouvelle session utilisateur
      if (action === 'create_session') {
        const { user } = bodyData;
        if (!user || !user.sessionID) {
          return res.status(400).json({ success: false, error: 'Missing user or sessionID' });
        }
        
        // Sauvegarder la session avec TTL de 30j (2592000 secondes)
        await redis.set(`session:${user.sessionID}`, JSON.stringify(user), 'EX', 2592000);
        
        return res.status(200).json({
          success: true,
          message: 'Session created',
          sessionID: user.sessionID
        });
      }
      
      // Supprimer une session utilisateur
      if (action === 'delete_session') {
        const { sessionID: delSessionID } = bodyData;
        if (!delSessionID) {
          return res.status(400).json({ success: false, error: 'Missing sessionID' });
        }
        
        await redis.del(`session:${delSessionID}`);
        
        return res.status(200).json({
          success: true,
          message: 'Session deleted'
        });
      }
      
      // Sauvegarder/mettre à jour les données
      const { data } = bodyData;
      if (!data) {
        return res.status(400).json({ success: false, error: 'Missing data' });
      }
      
      await redis.set('app_data', JSON.stringify(data), 'EX', 86400 * 30); // 30 jours
      
      return res.status(200).json({
        success: true,
        message: 'Data saved successfully'
      });
    }

    if (req.method === 'PUT') {
      // Ajouter/modifier un item
      const { item, type } = bodyData;
      if (!item || !type) {
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

      return res.status(200).json({
        success: true,
        item
      });
    }

    if (req.method === 'DELETE') {
      // Supprimer un item
      const { id, type } = bodyData;
      if (!id || !type) {
        return res.status(400).json({ success: false, error: 'Missing id or type' });
      }

      const data = await redis.get('app_data');
      const allData = data ? JSON.parse(data) : [];
      
      const filtered = allData.filter((d: any) => !(d.type === type && d.__backendId === id));
      await redis.set('app_data', JSON.stringify(filtered), 'EX', 86400 * 30);

      return res.status(200).json({
        success: true,
        message: 'Item deleted'
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Store API error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  } finally {
    if (redis) await redis.quit();
  }
}
