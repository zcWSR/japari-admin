"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var _logger = _interopRequireDefault(require("./utils/logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class Config {







  constructor() {this.DB = null;this.REDIS = null;this.OSU_APP_KEY = null;this.QQ_SERVER = null;this.NET_EAST_MUSIC_SERVER = null;this.ADMINS = null;this.BOT_QQ_ID = null;
    this.loadConfig();
  }

  loadConfig() {
    _logger.default.info('loading global config');
    const configJson = _fs.default.readFileSync(_path.default.resolve(__dirname, '../config.json'));
    const config = JSON.parse(configJson);const

    dbFilePath =








    config.dbFilePath,redisPort = config.redisPort,redisPw = config.redisPw,osuAppKey = config.osuAppKey,qqServer = config.qqServer,netEastMusicServer = config.netEastMusicServer,admins = config.admins,botQQId = config.botQQId,ocrSpaceKey = config.ocrSpaceKey;
    this.DB = {
      filePath: dbFilePath };

    this.REDIS = {
      REDIS_PORT: redisPort,
      REDIS_PW: redisPw };

    this.OSU_APP_KEY = osuAppKey;
    this.QQ_SERVER = qqServer;
    this.NET_EAST_MUSIC_SERVER = netEastMusicServer;
    this.ADMINS = admins;
    this.BOT_QQ_ID = botQQId;
    this.ORC_KEY = ocrSpaceKey;
  }}var _default =


new Config();exports.default = _default;