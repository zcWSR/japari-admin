import pinyinTable from '../utils/pinyin';

// 逻辑摘抄修改自 pakku.js
// https://github.com/xmcp/pakku.js under GPLv3

const edA = new Int16Array(0x10ffff);
const edB = new Int16Array(0x10ffff);
const edCounts = edA;
const MAX_COSINE = 30;
const MAX_DIST = 5;
const MIN_MSG_SIZE = 10;
const MAX_MSG_SIZE = 100;

const FULL_WIDTH =
  '　１２３４５６７８９０!＠＃＄％＾＆＊（）－＝＿＋［］｛｝;＇:＂,．／＜＞?＼｜｀～ｑｗｅｒｔｙｕｉｏｐａｓｄｆｇｈｊｋｌｚｘｃｖｂｎｍＱＷＥＲＴＹＵＩＯＰＡＳＤＦＧＨＪＫＬＺＸＣＶＢＮＭ';
const HALF_WIDTH =
  ' 1234567890！@#$%^&*()-=_+[]{}；\'："，./<>？\\|`~qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';

const FULL_WIDTH_MAP: Record<string, string> = Array.from(FULL_WIDTH).reduce(
  (result, char, index) => {
    result[char] = HALF_WIDTH[index]!;
    return result;
  },
  {} as Record<string, string>
);

class ReadAgainService {
  hash(a: number, b: number): number {
    return ((a << 10) ^ b) & 1048575;
  }

  filter(inp: string): string {
    let text = '';
    for (let i = 0; i < inp.length; i++) {
      const char = inp.charAt(i);
      text += FULL_WIDTH_MAP[char] ?? char;
    }
    return text.replace(/[ 　]+/g, ' ');
  }

  trimPinyin(s: string): string {
    const filtered = this.filter(s);
    return Array.from(filtered.toLowerCase())
      .map((c) => (pinyinTable as Record<string, string>)[c] ?? c)
      .join('');
  }

  editDistance(P: string, Q: string): number {
    for (let i = 0; i < P.length; i++) edCounts[P.charCodeAt(i)]++;
    for (let i = 0; i < Q.length; i++) edCounts[Q.charCodeAt(i)]--;

    let ans = 0;
    for (let i = 0; i < P.length; i++) {
      ans += Math.abs(edCounts[P.charCodeAt(i)]!);
      edCounts[P.charCodeAt(i)] = 0;
    }
    for (let i = 0; i < Q.length; i++) {
      ans += Math.abs(edCounts[Q.charCodeAt(i)]!);
      edCounts[Q.charCodeAt(i)] = 0;
    }
    return ans;
  }

  gen2gramArray(P: string): number[] {
    const pLength1 = P.length;
    P += P.charAt(0);
    const res: number[] = [];
    for (let i = 0; i < pLength1; i++) {
      res.push(this.hash(P.charCodeAt(i), P.charCodeAt(i + 1)));
    }
    return res;
  }

  cosineDistanceMemorized(Pgram: number[], Qgram: number[], Plen: number, Qlen: number): number {
    if (MAX_COSINE > 100) return 0;

    for (let i = 0; i < Plen; i++) edA[Pgram[i]!]++;
    for (let i = 0; i < Qlen; i++) edB[Qgram[i]!]++;

    let x = 0;
    let y = 0;
    let z = 0;

    for (let i = 0; i < Plen; i++) {
      const h1 = Pgram[i]!;
      if (edA[h1]) {
        y += edA[h1]! * edA[h1]!;
        if (edB[h1]) {
          x += edA[h1]! * edB[h1]!;
          z += edB[h1]! * edB[h1]!;
          edB[h1] = 0;
        }
        edA[h1] = 0;
      }
    }

    for (let i = 0; i < Qlen; i++) {
      const h1 = Qgram[i]!;
      if (edB[h1]) {
        z += edB[h1]! * edB[h1]!;
        edB[h1] = 0;
      }
    }
    return (x * x) / y / z;
  }

  similar(P: string, Q: string): boolean {
    if (P === Q) return true;

    if (P.length + Q.length > MAX_MSG_SIZE) return false;

    const dis = this.editDistance(P, Q);
    if (
      P.length + Q.length < MIN_MSG_SIZE
        ? dis < ((P.length + Q.length) / MIN_MSG_SIZE) * MAX_DIST - 1
        : dis <= MAX_DIST
    ) {
      return true;
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
      }
    }

    if (dis >= P.length + Q.length) return false;

    const Pgram = this.gen2gramArray(P);
    const Qgram = this.gen2gramArray(Q);
    const cos = ~~(this.cosineDistanceMemorized(Pgram, Qgram, P.length, Q.length) * 100);
    if (cos >= MAX_COSINE) return true;
    return false;
  }
}

export default new ReadAgainService();
