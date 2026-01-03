/**
 * A method which unwraps a given generic array, taking each element and accumulating them, if the given item is a nested array, it is flattened into the result.
 * Useful for flattening parser results built with the `and` and `many` combinators, which can produce nested arrays.
 * @param items - An array of items or nested arrays of items to be unwrapped.
 * @returns A flattened array containing all individual items.
 */
export const unwrapResult = <T>(items: (T | T[])[]): T[] => {
  const result: T[] = [];
  for (const item of items) {
    if (Array.isArray(item)) {
      result.push(...unwrapResult(item));
    } else {
      result.push(item);
    }
  }
  return result;
};