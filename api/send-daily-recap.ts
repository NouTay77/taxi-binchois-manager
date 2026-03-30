import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      chauffeurName, 
      chauffeurEmail,
      adminEmail,
      totalRecette, 
      nbCourses, 
      courses,
      date 
    } = req.body;

    if (!chauffeurName || !adminEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create HTML email content
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #E6B800 0%, #B38F00 100%); padding: 30px; border-radius: 10px; color: white; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px;">Service terminé ✓</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">${chauffeurName}</p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #E6B800; margin-top: 0;">Récapitulatif du jour</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #999; margin: 0 0 10px 0; font-size: 12px;">Recette du jour</p>
              <p style="color: #E6B800; font-size: 32px; font-weight: bold; margin: 0;">${totalRecette.toFixed(2)} €</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #999; margin: 0 0 10px 0; font-size: 12px;">Nombre de courses</p>
              <p style="color: #3B4A6B; font-size: 32px; font-weight: bold; margin: 0;">${nbCourses}</p>
            </div>
          </div>
        </div>
    `;

    // Add courses details if available
    if (courses && courses.length > 0) {
      htmlContent += `
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e0e0e0;">
          <h3 style="color: #3B4A6B; margin-top: 0;">Détail des courses</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5; border-bottom: 2px solid #e0e0e0;">
                <th style="padding: 12px; text-align: left; font-weight: bold; font-size: 12px;">Heure</th>
                <th style="padding: 12px; text-align: left; font-weight: bold; font-size: 12px;">Trajet</th>
                <th style="padding: 12px; text-align: right; font-weight: bold; font-size: 12px;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${courses.map((course: any, index: number) => `
                <tr style="border-bottom: 1px solid #e0e0e0; ${index % 2 === 0 ? 'background: #fafafa;' : ''}">
                  <td style="padding: 12px; font-size: 13px;">${course.heure_prise_en_charge || '-'}</td>
                  <td style="padding: 12px; font-size: 13px;">${course.commune_prise_en_charge || ''} → ${course.commune_fin_course || ''}</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold; color: ${course.client_paye ? '#10B981' : '#F59E0B'};">
                    ${course.prix || 0} €
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    htmlContent += `
      <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p>Taxi Binchois Manager</p>
        <p>Date: ${date || new Date().toLocaleDateString('fr-BE')}</p>
      </div>
    </div>
    `;

    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: adminEmail,
      subject: `Récapitulatif journalier - ${chauffeurName} - ${date || new Date().toLocaleDateString('fr-BE')}`,
      html: htmlContent,
    });

    return res.status(200).json({ success: true, messageId: response.data?.id });
  } catch (error) {
    console.error('Error sending daily recap:', error);
    return res.status(500).json({ 
      error: 'Failed to send daily recap',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
