import firebaseService from '../services/firebase-service';
import scheduleService from '../services/schedule-service';

const test = async () => {
  firebaseService.init();
  const docs = await scheduleService.getAllSchedule();
  docs.forEach((doc) => {
    console.log(doc.id, doc.data());
  });
  await scheduleService.setSchedule(
    345202960,
    '12,18 1,2,3,4,5,6,7',
    '我是本群五碗饭小助手，每到饭点我就会提醒大家吃五碗饭，吃饭要吃好，五碗才够饱。下次到了饭点我会继续提醒大家吃五碗饭，大家一起来成为每餐都吃五碗饭的吃饭小能手吧'
  );
};
test();
