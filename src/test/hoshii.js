import '../config';
import Loader from '../plugins/font-loader';
import R2Service from '../services/r2-service';
import HoShiiService from '../services/hoshii-service';

async function test() {
  R2Service.init();
  new Loader().init();
  const url = await HoShiiService.drawAndGetRemoteUrl('这是一条', '测试语句', 'test1');
  console.log(url);
}

export default test;
