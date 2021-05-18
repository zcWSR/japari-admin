// import test from './akhr';

// test();

import Loader from '../plugins/font-loader';
import HoShiiService from '../services/hoshii-service';

new Loader().init();
HoShiiService.drawImage('这是一条', '测试语句');
