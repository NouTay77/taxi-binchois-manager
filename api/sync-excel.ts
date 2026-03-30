import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // On ajoute des headers pour autoriser les connexions du téléphone
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. LECTURE (GET)
    if (req.method === 'GET') {
      const data = await kv.get('taxi_data');
      return res.status(200).json(data || []);
    }

    // 2. ÉCRITURE (POST)
    if (req.method === 'POST') {
      // On s'assure de récupérer les données peu importe le format
      const data = req.body;
      if (!data) {
        return res.status(400).json({ error: 'Pas de données reçues' });
      }
      await kv.set('taxi_data', data);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error: any) {
    console.error('Erreur KV:', error);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur', 
      details: error.message 
    });
  }
}