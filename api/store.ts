// Redis Data Store API
import Redis from 'ioredis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const redis = new Redis(process.env.REDIS_URL as string, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  enableOfflineQueue: false,
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('Redis connected'));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { action } = req.query;

    if (req.method === 'GET') {
      // Récupérer toutes les données
      const data = await redis.get('app_data');
      return res.status(200).json({
        success: true,
        data: data ? JSON.parse(data) : []
      });
    }

    if (req.method === 'POST') {
      // Sauvegarder/mettre à jour les données
      const { data } = req.body;
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
      const { item, type } = req.body;
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
      const { id, type } = req.body;
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

    res.status(400).json({ success: false, error: 'Invalid method' });
  } catch (err: any) {
    console.error('Store API error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
}
