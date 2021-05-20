"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));
var _config = _interopRequireDefault(require("../config"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class FirebaseService {
  init() {
    this.bucketUrl = 'japari-park-e9cc5.appspot.com';
    this.app = _firebaseAdmin.default.initializeApp({
      credential: _firebaseAdmin.default.credential.cert(_config.default.FIREBASE_KEY),
      storageBucket: this.bucketUrl });

    this.db = this.app.firestore();
    this.bucket = this.app.storage().bucket();
    this.groupCollection = this.db.collection('qqGroup');
  }}var _default =


new FirebaseService();exports.default = _default;