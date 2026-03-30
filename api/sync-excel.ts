import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Si on demande les données (GET)
    if (req.method === 'GET') {
      const data = await kv.get('taxi_data');
      return res.status(200).json(data || []);
    }

    // Si on enregistre les données (POST)
    if (req.method === 'POST') {
      // On accepte soit un objet avec {data: []} soit directement le tableau []
      const data = req.body.data || req.body; 
      await kv.set('taxi_data', data);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erreur de base de données Redis' });
  }
}