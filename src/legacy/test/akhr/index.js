import AkhrService from '../../services/akhr-service';
import AKHR_DATA from './hr-meta';

const ParsedResults = [
  {
    TextOverlay: {
      Lines: [],
      HasOverlay: false,
      Message: 'Text overlay is not provided as it is not requested'
    },
    TextOrientation: '0',
    FileParseExitCode: 1,
    ParsedText: '辅助干员\r\n位移\r\n爆发\r\n支援机械\r\n支援\r\n',
    ErrorMessage: '',
    ErrorDetails: ''
  }
];

AkhrService.AKHR_LIST = AkhrService.formatMetaData(AKHR_DATA);
const test = async () => {
  const words = (ParsedResults[0].ParsedText || '')
    .replace(/\r\n$/, '')
    .replace(/冫口了/g, '治疗')
    .split('\r\n');
  const hrList = await AkhrService.getAkhrList();
  const result = AkhrService.combine(words, hrList);
  console.log('result');
  console.log(JSON.stringify(result, null, 2));
  const msg = AkhrService.parseTextOutput(result);
  console.log('return');
  console.log(msg);
};

export default test;
