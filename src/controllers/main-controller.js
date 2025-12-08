import { Route, Router } from '../decorators/router';

@Router()
class MainController {
  @Route.get('/')
  main() {
    let message = '<h1>a simple command based OSU! game info searching qq-bot</h1>';
    message +=
      '<h2>get more info on my <a href="https://github.com/zcWSR/japari-admin">github</a></h2>';
    message += '<h2><a href="/japari">⇨ジャパリパーク⇦</a></h2>';
    return message;
  }
}

export default MainController;
