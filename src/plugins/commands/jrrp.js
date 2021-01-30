import { Command } from '../../decorators/plugin';
import QQService from '../../services/qq-service';

@Command({
  name: "jrrp",
  command: "jrrp",
  type: "all",
  info: "今天人品如何",
  level: 1
})
class Jrrp {
  run(body, type) {
    var seed = body.user_id + getDate() + getMonth() + getFullYear();
    var result = "";
    var rp = myRand(seed);

    if (body.sender.card) {
      result += body.sender.card + "\n";
    } else {
      result += body.sender.nickname + "\n";
    }
    result += "你今天的人品为：";
    result += rp.toString();
    if (rp <= 15) {
      result += "【大凶】";
    } else if (rp <= 30) {
      result += "【凶】";
    } else if (rp <= 50) {
      result += "【末吉】";
    }
    else if (rp <= 60) {
      result += "【小吉】";
    }
    else if (rp <= 80) {
      result += "【中吉】";
    } else if(rp >=90) {
      result += "【大吉】";
    }

    if (type === "group") {
      QQService.sendGroupMessage(body.group_id, result);
    }
    if (type === "private") {
      QQService.sendPrivateMessage(body.user_id, result);
    }
  }

  myRand (seed) {
    return Math.sin(seed) * 100;
  }
}