import { Router, Route } from '../decorators/router';
import botErrorErporter from '../middlewares/bot-error-reporter';

@Router()
class JapariController {
  @Route.post('/event', botErrorErporter)
  allEvent() {
  }
}

export default JapariController;
