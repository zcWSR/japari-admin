import { Router, Route } from '../decorators/router';

@Router()
class JapariController {
  @Route.get('/')
  async main(ctx, next) {
    return 'hello';
  }
}

export default JapariController;
