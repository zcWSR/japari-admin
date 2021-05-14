"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));
var _config = _interopRequireDefault(require("../config"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class FirebaseService {
  init() {
    this.app = _firebaseAdmin.default.initializeApp({
      credential: _firebaseAdmin.default.credential.cert(_config.default.FIREBASE_KEY_PATH) });

    this.db = this.app.firestore();
    this.groupCollection = this.db.collection('qqGroup');
  }}var _default =


new FirebaseService();exports.default = _default;