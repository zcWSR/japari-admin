import { Plugin } from '../decorators/plugin';
import FirebaseService from '../services/firebase-service';

@Plugin({
  name: 'firebase-loader',
  weight: Number.POSITIVE_INFINITY, // 优先级最高，后续初始化依赖 firebase
  type: null, // 类型为空, 不添加到插件队列内
  mute: true
})
class FirebaseLoader {
  init() {
    FirebaseService.init();
  }
}

export default FirebaseLoader;
