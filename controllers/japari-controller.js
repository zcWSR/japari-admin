import { Router, Route } from '../utils/decorators';

@Router()
class JapariController {
  @Route.get('/')
  async main(ctx) {
    ctx.body = 'hello';
  }
}

export default JapariController;
