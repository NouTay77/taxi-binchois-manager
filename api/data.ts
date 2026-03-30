// API Helper para Redux / Data Persistence
import Redis from 'ioredis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let redis: any;

function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL as string, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      connectTimeout: 10000,
      maxRetriesPerRequest: null,
    });

    redis.on('error', (err: any) => console.error('Redis error:', err));
    redis.on('connect', () => console.log('Redis connected'));
  }
  return redis;
}

async function getAllData(): Promise<any[]> {
  try {
    const redis = getRedis();
    const data = await redis.get('app_data');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error fetching from Redis:', err);
    return [];
  }
}

async function saveAllData(data: any[]): Promise<boolean> {
  try {
    const redis = getRedis();
    await redis.set('app_data', JSON.stringify(data), 'EX', 2592000); // 30 days
    return true;
  } catch (err) {
    console.error('Error saving to Redis:', err);
    return false;
  }
}

async function createItem(item: any): Promise<any> {
  try {
    if (!item.__backendId) {
      item.__backendId = Math.random().toString(36).substr(2, 9);
    }
    
    const allData = await getAllData();
    allData.push(item);
    
    const saved = await saveAllData(allData);
    if (!saved) throw new Error('Failed to save data');
    
    return { isOk: true, item };
  } catch (err: any) {
    return { isOk: false, error: err.message };
  }
}

async function updateItem(item: any): Promise<any> {
  try {
    if (!item.__backendId) {
      return { isOk: false, error: 'Missing __backendId' };
    }
    
    const allData = await getAllData();
    const index = allData.findIndex((d: any) => d.__backendId === item.__backendId);
    
    if (index === -1) {
      return { isOk: false, error: 'Item not found' };
    }
    
    allData[index] = { ...allData[index], ...item };
    const saved = await saveAllData(allData);
    
    if (!saved) throw new Error('Failed to save data');
    return { isOk: true, item: allData[index] };
  } catch (err: any) {
    return { isOk: false, error: err.message };
  }
}

async function deleteItem(id: string): Promise<any> {
  try {
    const allData = await getAllData();
    const filtered = allData.filter((d: any) => d.__backendId !== id);
    
    const saved = await saveAllData(filtered);
    if (!saved) throw new Error('Failed to save data');
    
    return { isOk: true };
  } catch (err: any) {
    return { isOk: false, error: err.message };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    // GET - Fetch all data
    if (req.method === 'GET') {
      const data = await getAllData();
      return res.status(200).json({
        success: true,
        data,
        count: data.length
      });
    }

    // POST - Create new item
    if (req.method === 'POST') {
      const { item } = req.body;
      if (!item) {
        return res.status(400).json({ success: false, error: 'Missing item object' });
      }

      const result = await createItem(item);
      if (!result.isOk) {
        return res.status(500).json({ success: false, error: result.error });
      }

      return res.status(201).json({ success: true, item: result.item });
    }

    // PUT - Update item
    if (req.method === 'PUT') {
      const { item } = req.body;
      if (!item || !item.__backendId) {
        return res.status(400).json({ success: false, error: 'Missing item or __backendId' });
      }

      const result = await updateItem(item);
      if (!result.isOk) {
        return res.status(500).json({ success: false, error: result.error });
      }

      return res.status(200).json({ success: true, item: result.item });
    }

    // DELETE - Delete item
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing id' });
      }

      const result = await deleteItem(id);
      if (!result.isOk) {
        return res.status(500).json({ success: false, error: result.error });
      }

      return res.status(200).json({ success: true, message: 'Item deleted' });
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
