export function toSmallCamel(string) {
  return string
    .replace(/_([a-zA-z])/g, ($, $1) => $1.toUpperCase())
    .replace(/^\w/i, ($) => $.toLowerCase());
}

export function toDash(string) {
  return string.replace(/([a-z])([A-Z])/g, ($, $1, $2) => `${$1}-${$2.toLowerCase()}`);
}

export function objKeyToSmallCamel(obj) {
  return Object.keys(obj).reduce((result, keyName) => {
    result[toSmallCamel(keyName)] = obj[keyName];
    return result;
  }, {});
}
