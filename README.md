# @peter.naydenov/deep-copy

Copy JavaScript data structures without recursion. The library is designed primarily for data-only objects and arrays, such as values produced by `JSON.parse`. It has no runtime dependencies.

For data made of ordinary objects, arrays, strings, numbers, booleans and `null`, the copy has its own objects and arrays. Changing a copied container does not change the original. The copy is mutable; “immutable copy” means the original data remains independent, not that the result is frozen.

Other JavaScript values are supported for convenience. Their behavior is described below, but full cloning of those values is outside the library's primary purpose. Use them at your own risk: some values are shared with the original, and getters or proxies can execute code or throw during copying.

## Installation

```sh
npm install @peter.naydenov/deep-copy
```

ES modules:

```js
import deepCopy from '@peter.naydenov/deep-copy'
```

CommonJS:

```js
const deepCopy = require('@peter.naydenov/deep-copy')
```

The package includes TypeScript declarations for the ES module import. They infer the input's type for the copy and expose the optional `Settings` type:

```ts
import deepCopy, { type Settings } from '@peter.naydenov/deep-copy'

const settings: Settings = { detectCycles: false }
const copy = deepCopy({ items: [1, 2] }, settings)
copy.items.push(3)
```

The inferred return type is intended for data-only structures. It cannot describe changes such as class instances becoming plain objects or symbol keys being omitted. The CommonJS `require` entry continues to work in JavaScript but does not include a separate CommonJS declaration.

For a browser, copy `dist/deep-copy.umd.js` from the installed package into your project and load it as a classic script. It exposes `deepCopy` as a global function:

```html
<script src="./deep-copy.umd.js"></script>
<script>
  const copy = deepCopy({ items: [1, 2, 3] })
</script>
```

The distribution bundles target ES2015 syntax and require standard ES2015 APIs, including `Map`. Use suitable polyfills for environments missing these APIs. The UMD `.js` file is intended for browser scripts; use the package entry point or `dist/deep-copy.cjs` for CommonJS.

## Usage

```js
const original = { items: [1, 2], details: { name: 'Peter' } }
const copy = deepCopy(original)
copy.items.push(3)             // original.items is still [1, 2]
copy.details.name = 'Alex'     // original.details.name is still 'Peter'
```

### What is copied

For data-only structures, arrays and ordinary objects are copied at every level, including their own enumerable string keys. Values from `JSON.parse` without a reviver have no symbol keys, getters, functions or circular references. JSON keys such as `"__proto__"` are copied as data properties.

The following behavior extends the library's usefulness beyond JSON-style data. It is provided for convenience; check whether it fits your data before relying on the copy being independent:

- Sparse array length and holes are preserved. Symbol-keyed and non-enumerable properties are not copied.
- Class instances with the ordinary `[object Object]` tag are copied into plain objects. Their prototype, methods, private fields, non-enumerable properties, and property descriptors are not preserved. Objects with a null prototype also become plain objects.
- Functions and other tagged objects, including `Date`, `RegExp`, `Map`, `Set`, typed arrays, `ArrayBuffer`, `Error`, `URL`, promises and DOM nodes, are retained **by reference**, including when they come from another JavaScript realm. Mutating one through the result also changes the original. Values with a custom `Symbol.toStringTag` can be classified as tagged objects and retained by reference.
- Primitive values are returned as they are. Getters on copied enumerable properties are called. Proxies and custom getters may have side effects or throw.
- Except for `"__proto__"`, properties are assigned normally. If built-in prototypes have been modified to add setters or non-writable properties, copying can invoke a setter, lose a property, or throw. Use unmodified standard prototypes for data-only inputs.

The copy is not frozen. It is independent of the original only for the containers that are copied. In particular, values inside a retained `Map` or `Set` are not traversed.

### Cycles and shared references

Circular references are preserved by default:

```js
const original = { name: 'root' }
original.self = original
const copy = deepCopy(original)
console.log(copy.self === copy) // true
```

A non-circular container used in two places is copied separately at each occurrence. This preserves the existing behavior, but can cause exponential time and memory use for a graph with many shared references.

For data known to be acyclic, including data directly returned by `JSON.parse` without a reviver, cycle checks can be disabled:

```js
const data = JSON.parse('{"items":[1,2]}')
const copy = deepCopy(data, { detectCycles: false })
```

With `detectCycles: false`, copying a cycle does not terminate and can exhaust memory.

| Option | Default | Effect |
| --- | --- | --- |
| `detectCycles` | `true` | Detect ancestor cycles. Set to `false` only when the data is known to be acyclic. |

## Performance

Traversal uses an explicit stack rather than recursion, so nesting depth is bounded by available memory rather than the call stack. It allocates output containers, traversal stacks, key arrays and, depending on options and depth, maps for tracking references.

The traversal copies enumerable string keys and skips symbol keys. It handles `"__proto__"` specially and uses ordinary assignment for other keys. Disabling cycle detection skips cycle bookkeeping when data is known to be acyclic.

### Release comparison

The following measurements compare the `v2.0.0` and `v3.0.1` repository tags with version 3.0.2. They use Node v26.12.0 on macOS with an Apple M3 Max. Each speed result is the median of five samples; every sample ran in a fresh process with three warmup copies. The deep-chain timings average 20 copies per sample. All inputs are acyclic data-only structures.

| Version | Flat object: 1 million properties | 100,000 nested records | 4,000-level chain |
| --- | ---: | ---: | ---: |
| 2.0.0 | 262.70 ms | 72.62 ms | 0.436 ms |
| 3.0.1 | 223.97 ms | 36.37 ms | 0.415 ms |
| 3.0.2 | 219.47 ms | 27.23 ms | 0.412 ms |
| 3.0.2, cycle checks off | 224.14 ms | 24.40 ms | 0.126 ms |

On these inputs, 3.0.2 is about 25% faster than 3.0.1 for nested records. The small differences on the flat and deep inputs are within the sample ranges. Version 2.0.0 does not support circular references; disabling cycle checks in 3.0.2 is safe only for acyclic inputs.

For the nested records, the copy retained 29.12 MiB with 3.0.1 and 17.56 MiB with 3.0.2 after garbage collection, based on the median of three fresh-process samples. The flat copies retained approximately 48 MiB in each version. Results depend on the runtime, machine and data shape; measure your own workload. The [complete release comparison](https://github.com/PeterNaydenov/deep-copy/blob/master/benchmarks/release-comparison.results.json) includes samples, ranges and source hashes. The measured 3.0.2 source differs from the current source only in JSDoc comments; the copying logic is unchanged.

The repository also includes benchmarks for the current source against `structuredClone` and for memory usage:

```sh
npm run benchmark:speed
npm run benchmark:memory
```

These scripts write their measurements and source hash to `benchmarks/`. Comparisons with `structuredClone` are workload-specific: the two functions do not have identical behavior for built-ins or shared references.

## Development

```sh
npm install
npm test
npm run cover
npm run build
```

`npm run build` generates the ESM, CommonJS and UMD builds and emits declarations from the JSDoc into `include/`. The test command also checks the TypeScript declarations. `npm pack` and `npm publish` run the build first through the `prepack` script.

## Links

- [Release history](Changelog.md)
- [Walk: deep copy with callbacks for modifying values](https://github.com/PeterNaydenov/walk)
- [Dt-toolbox: operations over data structures](https://github.com/PeterNaydenov/dt-toolbox)

Created by Peter Naydenov. Released under the [MIT License](LICENSE).
