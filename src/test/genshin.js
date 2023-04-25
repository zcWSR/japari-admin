import '../config';
import FirebaseService from '../services/firebase-service';
import GenshinService from '../services/genshin-service';

async function test() {
  await FirebaseService.init();
  const url = await GenshinService.drawCharaArtifactsAndGetRemoteUrl('212773177', 1);
  console.log(url);
}

export default test;
