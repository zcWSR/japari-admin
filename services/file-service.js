import { readdirSync } from 'fs';
import { resolve } from 'path';

import logger from '../utils/logger';
import { toDash } from '../utils/string-utils';

export async function getRoutersFromDir(path, app) {
  const fileNames = readdirSync(path);
  logger.info(`load routes from dir '${path}'`);
  return fileNames.reduce((result, fileName) => {
    const filePath = resolve(path, fileName);
    // eslint-disable-next-line
    const Controller = (require(filePath) || {}).default;
    if (!Controller) {
      logger.warn(`file '${filePath}' export nothing, skip`);
      return result;
    }
    let prefix = toDash(fileName.replace(/-?controller\.js/i, ''));
    if (!prefix || prefix === 'main') {
      prefix = '/';
    } else {
      prefix = `/${prefix}`;
    }
    const routes = new Controller(prefix).mount();
    if (app) {
      app.use(routes);
    }
    result.push(routes);
    return result;
  }, []);
}
