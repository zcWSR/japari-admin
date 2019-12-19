import pinyinTable from '../utils/pinyin';

// 逻辑摘抄修改自 pakku.js
// https://github.com/xmcp/pakku.js under GPLv3

const edA = new Int16Array(0x10ffff);
const edB = new Int16Array(0x10ffff);
const edCounts = edA; // to save memory
const MAX_COSINE = 30; // 词频向量合并强度 2-Gram 频率向量的夹角
const MAX_DIST = 5; // 编辑距离合并强度 根据编辑距离判断不完全一致但内容相近（例如有错别字）
const MIN_MSG_SIZE = 10;
const MAX_MSG_SIZE = 100;

const FULL_WIDTH = '　１２３４５６７８９０!＠＃＄％＾＆＊（）－＝＿＋［］｛｝;＇:＂,．／＜＞?＼｜｀～ｑｗｅｒｔｙｕｉｏｐａｓｄｆｇｈｊｋｌｚｘｃｖｂｎｍＱＷＥＲＴＹＵＩＯＰＡＳＤＦＧＨＪＫＬＺＸＣＶＢＮＭ';
const HALF_WIDTH = ' 1234567890！@#$%^&*()-=_+[]{}；\'："，./<>？\\|`~qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';


const FULL_WIDTH_MAP = Array.from(FULL_WIDTH).reduce((result, char, index) => {
  result[char] = HALF_WIDTH[index];
  return result;
}, {});

class ReadAgainService {
  hash(a, b) {
    return ((a << 10) ^ b) & 1048575;
  }

  filter(inp) {
    let text = '';
    for (let i = 0; i < inp.length; i++) {
      const char = inp.charAt(i);
      text += (FULL_WIDTH_MAP[char] || char);
    }
    // eslint-disable-next-line no-irregular-whitespace
    return text.replace(/[ 　]+/g, ' ');
  }

  trimPinyin(s) {
    s = this.filter(s);
    return Array.from(s.toLowerCase())
      .map(c => pinyinTable[c] || c)
      .join('');
  }

  editDistance(P, Q) {
    // this is NOT the edit_distance you think

    for (let i = 0; i < P.length; i++) edCounts[P.charCodeAt(i)]++;
    for (let i = 0; i < Q.length; i++) edCounts[Q.charCodeAt(i)]--;

    let ans = 0;

    for (let i = 0; i < P.length; i++) {
      ans += Math.abs(edCounts[P.charCodeAt(i)]);
      edCounts[P.charCodeAt(i)] = 0;
    }

    for (let i = 0; i < Q.length; i++) {
      ans += Math.abs(edCounts[Q.charCodeAt(i)]);
      edCounts[Q.charCodeAt(i)] = 0;
    }

    return ans;

    // this is the true edit_distance

    // const Plen = P.length;
    // const Qlen = Q.length;
    // const matrix = [];
    // for (let i = 0; i <= Plen; i++) {
    //   matrix[i] = [];
    //   for (let j = 0; j < Qlen; j++) {
    //     if (i === 0) {
    //       matrix[0][j] = j;
    //     } else if (j === 0) {
    //       matrix[i][0] = i;
    //     } else {
    //       // 相同为0，不同置1
    //       const cost = P[i - 1] !== Q[j - 1] ? 1 : 0;
    //       matrix[i][j] = Math.min(
    //         matrix[i - 1][j] + 1,
    //         matrix[i][j - 1] - 1,
    //         matrix[i - 1][j - 1] + cost
    //       );
    //     }
    //   }
    // }
    // return matrix[Plen][Qlen];
  }

  gen2gramArray(P) {
    const pLength1 = P.length;
    P += P.charAt(0);
    const res = [];
    for (let i = 0; i < pLength1; i++) res.push(this.hash(P.charCodeAt(i), P.charCodeAt(i + 1)));
    return res;
  }

  cosineDistanceMemorized(Pgram, Qgram, Plen, Qlen) {
    if (MAX_COSINE > 100) return 0;

    for (let i = 0; i < Plen; i++) edA[Pgram[i]]++;
    for (let i = 0; i < Qlen; i++) edB[Qgram[i]]++;

    let x = 0;
    let y = 0;
    let z = 0;

    for (let i = 0; i < Plen; i++) {
      const h1 = Pgram[i];
      if (edA[h1]) {
        y += edA[h1] * edA[h1];
        if (edB[h1]) {
          x += edA[h1] * edB[h1];
          z += edB[h1] * edB[h1];
          edB[h1] = 0;
        }
        edA[h1] = 0;
      }
    }

    for (let i = 0; i < Qlen; i++) {
      const h1 = Qgram[i];
      if (edB[h1]) {
        z += edB[h1] * edB[h1];
        edB[h1] = 0;
      }
    }
    return (x * x) / y / z;
  }

  similar(P, Q) {
    if (P === Q) {
      return true;
      // return '==';
    }

    if (P + Q > MAX_MSG_SIZE) {
      return false;
    }

    const dis = this.editDistance(P, Q);
    if (
      P.length + Q.length < MIN_MSG_SIZE
        ? dis < ((P.length + Q.length) / MIN_MSG_SIZE) * MAX_DIST - 1
        : dis <= MAX_DIST
    ) {
      return true;
      // return `≤${dis}`;
    }
    const Ppinyin = this.trimPinyin(P);
    if (Ppinyin) {
      const Qpinyin = this.trimPinyin(Q);
      const pyDis = this.editDistance(Ppinyin, Qpinyin);
      if (
        P.length + Q.length < MIN_MSG_SIZE
          ? pyDis < ((P.length + Q.length) / MIN_MSG_SIZE) * MAX_DIST - 1
          : pyDis <= MAX_DIST
      ) {
        return true;
        // return `P≤${pyDis}`;
      }
    }

    // they have nothing similar. cosine_distance test can be bypassed
    if (dis >= P.length + Q.length) {
      return false;
    }
    const Pgram = this.gen2gramArray(P);
    const Qgram = this.gen2gramArray(Q);
    const cos = ~~(this.cosineDistanceMemorized(Pgram, Qgram, P.length, Q.length) * 100);
    if (cos >= MAX_COSINE) {
      return true;
      // return `${cos}%`;
    }
    return false;
  }
}

export default new ReadAgainService();
