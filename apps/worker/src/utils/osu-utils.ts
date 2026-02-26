const modeMap: Record<number, string> = {
  0: 'NF',
  1: 'EZ',
  3: 'HD',
  4: 'HR',
  5: 'SD',
  6: 'DT',
  8: 'HT',
  9: 'NC',
  10: 'FL',
  12: 'SO',
  14: 'PF',
  15: '4K',
  16: '5K',
  17: '6K',
  18: '7K',
  19: '8K',
  20: 'FI',
  24: '9K'
};

export function toBin(intNum: number): string {
  let n = intNum;
  let answer = '';
  if (/\d+/.test(String(intNum))) {
    while (n !== 0) {
      answer = Math.abs(n % 2) + answer;
      n = Number.parseInt(String(n / 2), 10);
    }
    if (answer.length === 0) answer = '0';
    return answer;
  }
  return '0';
}

export function numberToOsuModes(num: number): string[] {
  const modes: string[] = [];
  const bins = toBin(num).split('').reverse();
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

export function numberToStar(): void {}
