import admin from 'firebase-admin';
import Config from '../config';

class FirebaseService {
  init() {
    this.app = admin.initializeApp({
      credential: admin.credential.cert(Config.FIREBASE_KEY_PATH)
    });
    this.db = this.app.firestore();
    this.groupCollection = this.db.collection('qqGroup');
  }
}

export default new FirebaseService();
