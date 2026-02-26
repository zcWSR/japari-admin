export function getProcessArgv(): Record<string, string | true> {
  const { argv } = process;
  if (argv.length <= 2) return {};
  const argvClone = argv.slice(2);
  return argvClone.reduce<Record<string, string | true>>((prev, curr) => {
    const keyMatch = curr.match(/^-+(\w+)=?(.*)$/);
    if (!keyMatch) return prev;
    const [, key, value] = keyMatch;
    if (key) prev[key] = value !== undefined && value !== '' ? value : true;
    return prev;
  }, {});
}

export const sleep = (timeout = 2000): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), timeout);
  });

export default getProcessArgv;
