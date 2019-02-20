import { Router, Route } from '../utils/decorators';

@Router()
class JapariController {
  @Route.get('/')
  async main(ctx, next) {
    return 'hello';
  }
}

export default JapariController;
