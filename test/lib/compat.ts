/**
 * Compatibility Layer for Node.js 0.8+
 * Local to this package - contains only needed functions.
 */

// Array.prototype.includes (ES2016)
export function arrayIncludes<T>(arr: T[], search: T): boolean {
  if (typeof arr.includes === 'function') {
    return arr.includes(search);
  }
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === search) return true;
  }
  return false;
}

// String.prototype.endsWith (ES2015)
export function stringEndsWith(str: string, search: string, length?: number): boolean {
  if (typeof str.endsWith === 'function') {
    return str.endsWith(search, length);
  }
  length = length === undefined ? str.length : length;
  const pos = length - search.length;
  return pos >= 0 && str.indexOf(search, pos) === pos;
}
