"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _router = require("../decorators/router");var _dec, _dec2, _class, _class2;function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {var desc = {};Object.keys(descriptor).forEach(function (key) {desc[key] = descriptor[key];});desc.enumerable = !!desc.enumerable;desc.configurable = !!desc.configurable;if ('value' in desc || desc.initializer) {desc.writable = true;}desc = decorators.slice().reverse().reduce(function (desc, decorator) {return decorator(target, property, desc) || desc;}, desc);if (context && desc.initializer !== void 0) {desc.value = desc.initializer ? desc.initializer.call(context) : void 0;desc.initializer = undefined;}if (desc.initializer === void 0) {Object.defineProperty(target, property, desc);desc = null;}return desc;}let


MainController = (_dec = (0, _router.Router)(), _dec2 =
_router.Route.get('/'), _dec(_class = (_class2 = class MainController {
  main() {
    let message = '<h1>a simple command based OSU! game info searching qq-bot</h1>';
    message += '<h2>get more info on my <a href="https://github.com/zcWSR/japari-admin">github</a></h2>';
    message += '<h2><a href="/japari">⇨ジャパリパーク⇦</a></h2>';
    return message;
  }}, (_applyDecoratedDescriptor(_class2.prototype, "main", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "main"), _class2.prototype)), _class2)) || _class);var _default =


MainController;exports.default = _default;