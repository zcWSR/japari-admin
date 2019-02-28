import { Router, Route } from '../decorators/router';
import botErrorErporter from '../middlewares/bot-error-reporter';
import logger from '../utils/logger';

@Router()
class JapariController {
  @Route.post('/event', botErrorErporter)
  async allEvent({ request }) {
    const botEvent = request.body;
    return {};
  }

  @Route.post('/index', botErrorErporter)
  async index() {
    logger.info('get');
    return 'get';
  }
}

export default JapariController;
