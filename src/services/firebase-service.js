import admin from 'firebase-admin';
import Config from '../config';

class FirebaseService {
  init() {
    this.bucketUrl = 'japari-park-e9cc5.appspot.com';
    this.app = admin.initializeApp({
      credential: admin.credential.cert(Config.FIREBASE_KEY),
      storageBucket: this.bucketUrl
    });
    this.bucket = this.app.storage().bucket();
    this.db = this.app.firestore();
  }

  getSchedulesRef() {
    if (this.schedulesRef) return this.schedulesRef;
    this.schedulesRef = this.db.collection('schedules');
    return this.schedulesRef;
  }
}

export default new FirebaseService();
