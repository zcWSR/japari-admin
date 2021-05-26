// import test from './akhr';

// test();

import Loader from '../plugins/font-loader';
import '../config';
import FirebaseService from '../services/firebase-service';
import HoShiiService from '../services/hoshii-service';

async function test() {
  await FirebaseService.init();
  new Loader().init();
  const url = await HoShiiService.drawAndGetRemoteUrl('这是一条', '测试语句', 'test1');
  console.log(url);
}

test();
