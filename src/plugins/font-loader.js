import path from 'path';
import { Plugin } from '../decorators/plugin';
import TextMeasurer from '../utils/text-measurer';

@Plugin({
  name: 'font-loader',
  weight: 1,
  type: null, // 类型为空, 不添加到插件队列内
  mute: true
})
class FontLoader {
  init() {
    TextMeasurer.registerFont(
      path.resolve(__dirname, '../../res/font/SourceHanSansSC-Regular.otf'),
      'SourceHanSansSC'
    );
    TextMeasurer.registerFont(
      path.resolve(__dirname, '../../res/font/NotoSansSC-Regular.otf'),
      'NotoSansSC'
    );
    TextMeasurer.registerFont(
      path.resolve(__dirname, '../../res/font/NotoSerifSC-Regular.otf'),
      'NotoSerifSC'
    );
  }
}

export default FontLoader;
