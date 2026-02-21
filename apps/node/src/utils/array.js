/**
 * 生成数组的所有组合
 * @param {Array} arr - 源数组
 * @param {number} size - 组合大小
 * @returns {Array} 所有组合的数组
 *
 * @example
 * combinations(['a', 'b', 'c'], 2)
 * // => [['a', 'b'], ['a', 'c'], ['b', 'c']]
 */
export function combinations(arr, size) {
  if (size === 0) return [[]];
  if (size > arr.length) return [];
  if (size === arr.length) return [arr];

  const result = [];
  const helper = (start, combo) => {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  };

  helper(0, []);
  return result;
}

export default {
  combinations
};
