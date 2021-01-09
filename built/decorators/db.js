"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.withTransaction = exports.createWithLog = void 0;var _logger = _interopRequireDefault(require("../utils/logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

/**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @param {string} tableName
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */
const createWithLog = tableName => (target, name, descriptor) => {
  const origin = descriptor.value;
  // eslint-disable-next-line
  descriptor.value = /*#__PURE__*/_asyncToGenerator(function* () {
    try {
      if (!this.DBInstance) {
        throw new Error("no db instance, may be your plugin class has not extends class 'Plugin'");
      }
      if (yield this.DBInstance.schema.hasTable(tableName)) {
        _logger.default.info(`table '${tableName}' exists, skip`);
      } else {
        _logger.default.info(`table '${tableName}' is creating`);
        yield this.DBInstance.schema.createTable(tableName, origin.bind(this));
        _logger.default.info(`table '${tableName}' has been created`);
      }
    } catch (e) {
      _logger.default.error(`an error occured during table '${tableName}' check`);
      _logger.default.error(e.toString());
      throw new Error('create or check table with Error');
    }
  });
  return descriptor;
};exports.createWithLog = createWithLog;

const withTransaction = (target, name, descriptor) => {
  const origin = descriptor.value;
  // eslint-disable-next-line
  descriptor.value = function (...args) {
    // try {
    return this.DBInstance.transaction(trx => origin.call(this, trx, ...args));
    // } catch (e) {
    //   logger.error(e);
    //   return null;
    // }
  };
  return descriptor;
};exports.withTransaction = withTransaction;