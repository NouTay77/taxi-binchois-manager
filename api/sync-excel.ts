import * as XLSX from 'xlsx';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Define file paths
    const baseDir = process.cwd();
    const filename = type === 'user' ? 'Chauffeurs.xlsx' : 'Vehicules.xlsx';
    const filepath = join(baseDir, filename);

    // Prepare data based on type
    let jsonData: any[] = [];
    
    if (type === 'user') {
      jsonData = data.map((item: any) => ({
        'Nom': item.nom || '',
        'Prenom': item.prenom || '',
        'Email': item.email || '',
        'Role': item.role || 'chauffeur',
        'Actif': item.active ? 'Oui' : 'Non'
      }));
    } else if (type === 'vehicule') {
      jsonData = data.map((item: any) => ({
        'Immatriculation': item.immatriculation || '',
        'Marque': item.marque || '',
        'Modele': item.modele || '',
        'Statut': item.statut_vehicule || 'libre'
      }));
    }

    // Create or update Excel file
    const worksheet = XLSX.utils.json_to_sheet(jsonData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type === 'user' ? 'Chauffeurs' : 'Vehicules');
    
    // Write file
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    writeFileSync(filepath, wbout);

    return res.status(200).json({ 
      success: true, 
      message: `Fichier ${filename} mis à jour avec ${jsonData.length} enregistrements`,
      file: filename 
    });
  } catch (error) {
    console.error('Error updating Excel:', error);
    return res.status(500).json({ 
      error: 'Failed to update Excel file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
