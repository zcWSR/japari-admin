export function toSmallCamel(string: string): string {
  return string
    .replace(/_([a-zA-z])/g, (_, $1: string) => $1.toUpperCase())
    .replace(/^\w/, ($) => $.toLowerCase());
}

export function toDash(string: string): string {
  return string.replace(
    /([a-z])([A-Z])/g,
    (_, $1: string, $2: string) => `${$1}-${$2.toLowerCase()}`
  );
}

export function objKeyToSmallCamel<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  return Object.keys(obj).reduce<Record<string, unknown>>((result, keyName) => {
    result[toSmallCamel(keyName)] = obj[keyName];
    return result;
  }, {});
}
