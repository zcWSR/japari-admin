// eslint-disable
const path = require('path');
require('@babel/register')({
  extends: path.resolve(__dirname, '.babelrc'),
  ignore: [/node_modules/]
});
require('@babel/polyfill');
require('./index');
