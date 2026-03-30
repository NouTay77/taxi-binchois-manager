import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Lecture : le téléphone demande la liste
    if (req.method === 'GET') {
      const data = await kv.get('taxi_data');
      return res.status(200).json(data || []);
    }

    // Écriture : le PC enregistre les chauffeurs
    if (req.method === 'POST') {
      const data = req.body; 
      await kv.set('taxi_data', data);
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erreur de base de données' });
  }
}