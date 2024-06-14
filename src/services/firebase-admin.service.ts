import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
  private defaultApp: admin.app.App;

  constructor() {
    this.defaultApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  async sendNotification(
    token: string,
    title: string,
    body: string,
    data: any,
  ) {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      token,
    };

    try {
      await this.defaultApp.messaging().send(message);
      console.log('Successfully sent message');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}
