import { Plugin } from '../decorators/plugin';
import FirebaseService from '../services/firebase-service';

@Plugin({
  name: 'firebase-loader',
  weight: 1,
  type: null, // 类型为空, 不添加到插件队列内
  mute: true
})
class FirebaseLoader {
  init() {
    FirebaseService.init();
  }
}

export default FirebaseLoader;
