import { createClient } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// On crée le client avec les variables que Vercel vient d'injecter
const kv = createClient({
  url: process.env.KV_REST_API_URL || process.env.REDIS_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const data = await kv.get('taxi_data');
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const data = req.body; 
      await kv.set('taxi_data', data);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Erreur Redis détaillée:", error);
    return res.status(500).json({ error: 'Erreur de base de données', details: error });
  }
}