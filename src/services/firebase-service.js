import admin from 'firebase-admin';
import Config from '../config';

class FirebaseService {
  init() {
    this.bucketUrl = 'japari-park-e9cc5.appspot.com';
    this.app = admin.initializeApp({
      credential: admin.credential.cert(Config.FIREBASE_KEY),
      storageBucket: this.bucketUrl
    });
    this.db = this.app.firestore();
    this.bucket = this.app.storage().bucket();
    this.groupCollection = this.db.collection('qqGroup');
  }
}

export default new FirebaseService();
