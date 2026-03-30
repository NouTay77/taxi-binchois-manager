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
    const { to, subject, message, attachmentName, attachmentBase64, htmlContent } = req.body;

    if (!to || !subject || (!message && !htmlContent)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let emailOptions: any = {
      from: 'onboarding@resend.dev',
      to: to,
      subject: subject,
    };

    // Support both plain text and HTML content
    if (htmlContent) {
      emailOptions.html = htmlContent;
    } else {
      emailOptions.html = `<p>${message.replace(/\n/g, '<br>')}</p>`;
    }

    // Add attachment if provided
    if (attachmentName && attachmentBase64) {
      const buffer = Buffer.from(attachmentBase64.split(',')[1] || attachmentBase64, 'base64');
      emailOptions.attachments = [
        {
          filename: attachmentName,
          content: buffer,
        },
      ];
    }

    const response = await resend.emails.send(emailOptions);

    return res.status(200).json({ success: true, messageId: response.data?.id });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
