import { Injectable } from '@nestjs/common';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string, body: string, isHtml = false) {
    if (!to) return;
    
    try {
      // Use Firebase "Trigger Email" Extension via Firestore 'mail' collection
      await getFirestore().collection('mail').add({
        to: to,
        message: {
          subject: subject,
          html: isHtml ? body : undefined,
          text: !isHtml ? body : undefined,
        },
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log(`Email queued in Firestore 'mail' collection for ${to}`);
    } catch (error) {
      console.error(`Failed to queue email for ${to}:`, error);
    }
  }
}
