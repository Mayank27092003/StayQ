import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

@Global()
@Module({})
export class FirebaseModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (getApps().length === 0) {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('Firebase Admin SDK initialized with explicit credentials.');
      } else {
        console.log('Initializing Firebase Admin SDK with Application Default Credentials (ADC).');
        // This will automatically pick up the environment project ID when running on Google Cloud Run
        initializeApp();
      }
    }
  }
}
