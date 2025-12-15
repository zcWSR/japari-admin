import '../config';
import R2Service from '../services/r2-service';
import GenshinService from '../services/genshin-service';

async function test() {
  R2Service.init();
  const url = await GenshinService.drawCharaArtifactsAndGetRemoteUrl('212773177', 1);
  console.log(url);
}

export default test;
