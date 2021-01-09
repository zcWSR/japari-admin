"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.toBin = toBin;exports.numberToOsuModes = numberToOsuModes;exports.numberToStar = numberToStar;const modeMap = {
  0: 'NF',
  1: 'EZ',
  // 虽然TD已经实装，但是MOD图标还是 不做 不画
  3: 'HD',
  4: 'HR',
  5: 'SD',
  6: 'DT',
  // 7是RX，不会上传成绩
  8: 'HT',
  9: 'NC',
  10: 'FL',
  // 11是Auto
  12: 'SO',
  // 13是AutoPilot
  14: 'PF',
  15: '4K',
  16: '5K',
  17: '6K',
  18: '7K',
  19: '8K',
  20: 'FI',
  // 21是RD，Mania的Note重新排布
  // 22是Cinema，但是不知道为什么有一个叫LastMod的名字
  // 23是Target Practice
  24: '9K'
  // 25是Mania的双人合作模式，Unrank
  // Using 1K, 2K, or 3K mod will result in an unranked play.
  // The mod does not work on osu!mania-specific beatmaps.
  // 26 1K，27 3K，28 2K
};
// ▂ ▃ ▄ ▅ ▆ ▇ █
// const startMap = {
//   0: '▂',
//   1: '',
//   2: '',
//   3: '',
//   4: '',
//   5: '▅',
//   6: '',
//   7: '',
//   8: '',
//   9: ''
// };

function toBin(intNum) {
  let answer = '';
  if (/\d+/.test(intNum)) {
    while (intNum != 0) {// eslint-disable-line
      answer = Math.abs(intNum % 2) + answer;
      intNum = parseInt(intNum / 2, 10);
    }
    if (answer.length == 0) answer = '0'; // eslint-disable-line
    return answer;
  }
  return '0';
}

function numberToOsuModes(num) {
  const modes = [];
  const bins = toBin(num).
  split('').
  reverse();
  bins.forEach((bin, index) => {
    const mode = modeMap[index];
    if (bin === '1' && mode) {
      modes.push(mode);
    }
  });
  if (modes.indexOf('NC') >= 0) {
    const index = modes.indexOf('DT');
    modes.splice(index, 1);
  }
  if (modes.indexOf('PF') >= 0) {
    const index = modes.indexOf('SD');
    modes.splice(index, 1);
  }
  if (modes.length) {
    return modes.sort();
  }
  return ['None'];
}

function numberToStar() {}