"use strict";require("core-js/modules/es.string.replace");Object.defineProperty(exports, "__esModule", { value: true });exports.toSmallCamel = toSmallCamel;exports.toDash = toDash;exports.objKeyToSmallCamel = objKeyToSmallCamel;function toSmallCamel(string) {
  return string.
  replace(/_([a-zA-z])/g, ($, $1) => $1.toUpperCase()).
  replace(/^\w/i, $ => $.toLowerCase());
}

function toDash(string) {
  return string.replace(/([a-z])([A-Z])/g, ($, $1, $2) => `${$1}-${$2.toLowerCase()}`);
}

function objKeyToSmallCamel(obj) {
  return Object.keys(obj).reduce((result, keyName) => {
    result[toSmallCamel(keyName)] = obj[keyName];
    return result;
  }, {});
}