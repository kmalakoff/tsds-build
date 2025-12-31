/**
 * Compatibility Layer for Node.js 0.8+
 * Local to this package - contains only needed functions.
 */

// Array.prototype.includes (ES2016)
export function arrayIncludes<T>(arr: T[], search: T): boolean {
  if (typeof arr.includes === 'function') return arr.includes(search);
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === search) return true;
  }
  return false;
}

// String.prototype.endsWith (ES2015)
const hasEndsWith = typeof String.prototype.endsWith === 'function';
export function stringEndsWith(str: string, search: string, position?: number): boolean {
  if (hasEndsWith) return str.endsWith(search, position);
  const len = position === undefined ? str.length : position;
  return str.lastIndexOf(search) === len - search.length;
}
