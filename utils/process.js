export const getProcessArgv = () => {
  const { argv } = process;
  if (argv.length <= 2) return {};
  let argvClone = [...argv];
  argvClone = argvClone.slice(2);
  return argvClone.reduce((prev, curr) => {
    const keyMatch = curr.match(/^-+(\w+)=?(.*)$/);
    if (!keyMatch) return prev;
    const [, key, value] = keyMatch;
    prev[key] = value;
    return prev;
  }, {});
};

export default getProcessArgv;
