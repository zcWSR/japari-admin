import { Router, Route } from '../decorators/router';

@Router()
class JapariController {
  @Route.post('/event')
  allEvent() {
    return {};
  }
}

export default JapariController;
