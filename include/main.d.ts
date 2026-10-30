/**
 *     deepCopy
 *
 *     Copies JavaScript objects and arrays, retaining tagged values by reference.
 *
 *     The traversal is iterative. Containers are kept on an explicit stack
 *     instead of being copied recursively, so depth is bounded by available
 *     memory instead of by the call stack.
 *
 *     History notes:
 *        - Development started on January 8th, 2022
 *        - Published on GitHub for first time: January 9th, 2022
 *        - Iterative traversal. October 28th, 2026
 */
export type Settings = {
    /**
     * Detect circular references. Set to
     * false only for acyclic data; copying a cycle without checks does not finish.
     */
    detectCycles?: boolean;
};
/**
 * Copy a data-only structure without recursion.
 *
 * Own enumerable string keys of objects and arrays are copied. Sparse array
 * lengths and holes are preserved. Circular references point to the copied
 * ancestor unless cycle detection is disabled. Shared non-circular containers
 * are copied separately.
 *
 * Functions and tagged objects such as Date, Map and Set are kept by reference.
 * Class instances may become plain objects; symbol keys and non-enumerable
 * properties are not copied. The generic return type describes data-only input;
 * it cannot represent these changes for arbitrary JavaScript values.
 *
 * @template T
 * @param {T} origin The value or data structure to copy.
 * @param {Settings} [settings] Optional traversal settings.
 * @returns {T} A copy of the data structure, or the original value when retained by reference.
 * @example
 * const copy = deepCopy({ items: [1, 2] })
 * copy.items.push(3)
 * @example
 * const copy = deepCopy({ items: [1, 2] }, { detectCycles: false })
 */
declare function deepCopy<T>(origin: T, settings?: Settings): T;
export default deepCopy;
