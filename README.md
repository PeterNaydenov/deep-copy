# Deep copy ( @peter.naydenov/deep-copy)

Creates an immutable copies of javascript data structures.

## Installation

Install for node.js projects by writing in your terminal:
```
npm install @peter.naydenov/deep-copy
```

Once it has been installed, it can be used by writing this line of JavaScript:

```js
let deepCopy = require ( '@peter.naydenov/deep-copy' )
```
or

```js
import deepCopy from '@peter.naydenov/deep-copy'
```



**Installation for browsers**: Execute script '`npm run build`' in the console. Then grab file "`dist/deep-copy.umd.js`" and put it inside the project. Request the file from HTML page. Global variable 'deepCopy' is available for use.


            Note:
            The library needs 'Map' (ES2015). If support for old browsers 
            is required, add a polyfill for 'Map'.










# How it use it?

```js
let 
      x = {
              ls   : [ 1,2,3 ]
            , name : 'Peter'
            , props : {
                          eyeColor: 'blue'
                        , age     : 47
                        , height  : 176
                        , sizes : [12,33,12,21]
                    }
            }
    , r = deepCopy ( x )
    ;
r.props.sizes.push ( 66 )   // will not change x.props.sizes
x.props.sizes[0] = 222222   // will not change r.props.sizes[0]
x.props.test = 'hello'      // will not create `test` in r.props
// Data-structures 'x' and 'r' are completely decoupled
```





## What is copied and what is kept?

Plain objects and arrays are copied. Every own enumerable key of a plain
object is copied, and the gaps of a sparse array stay empty.

Values that hold their data outside of own enumerable keys are kept by
reference. Nothing of them is lost:

| Value | Result |
| --- | --- |
| number, bigint, string, boolean, null, undefined, symbol | copied as it is |
| function | kept by reference |
| plain object, array | copied |
| Date, RegExp, Map, Set, WeakMap, WeakSet, ArrayBuffer, DataView, typed array, DOM node | kept by reference |
| class instance | copied as a plain object |

A container that is used in two places is copied twice. Both copies are
independent of the source and of each other.

A circular reference points to the copy of the container it closes the
circle with:

```js
let x = { name:'root' }
x.self = x

let r = deepCopy ( x )
r.self === r      // true
```

The check for circular references can be switched off when the data is
known to be acyclic:

```js
let r = deepCopy ( x, { detectCycles:false } )
```

Without the check, the copy of a circular structure does not end. It fills
the memory instead.

The traversal is iterative, so the depth of the data is bounded by memory
and not by the call stack.



## Options

| Option | Default | Description |
| --- | --- | --- |
| `detectCycles` | `true` | `false` skips the circular-reference checks and their bookkeeping. Use it when the data is known to be acyclic. |



## Performance

The traversal keeps the containers on an explicit stack. There are no
generator functions and no recursion, so a copy allocates one object per
copied container and nothing else.

The measurements below use Node v26.12.0 on macOS arm64. Each sample ran
in a fresh Node process with three warmup copies and explicit garbage
collection outside the timer. Operations rotated between samples and the
table shows the median of five samples. Deep-chain samples averaged five
copies. The [benchmark script](benchmarks/speed.mjs) and
[complete samples](benchmarks/speed.results.json) are in the repository:

```sh
npm run benchmark:speed
```

The inputs contain no circular references:

- **Flat object:** 1,000,000 properties named `key0` through `key999999`, each holding its index as a number.
- **Nested records:** an array of 100,000 records shaped as `{ id, name:'item', metadata:{ active:true, score:id, tags:['a','b'] } }`. There are 600,000 leaf values.
- **Deep chain:** 4,000 nested `child` links ending in `{ leaf:1 }`. There is one leaf value.

| Operation | Flat object | Nested records | Deep chain |
| --- | ---: | ---: | ---: |
| `structuredClone` | 500.45 | 80.51 | Failed¹ |
| `deep-copy` v2.0.0 | 261.07 | 74.11 | 0.61 |
| `deep-copy` current | 227.41 | 36.86 | 0.53 |
| `deep-copy` current, `detectCycles:false` | 224.34 | 33.87 | 0.12 |

Times are milliseconds for one complete copy.

¹ `structuredClone` threw `RangeError: Maximum call stack size exceeded` on the 4,000-level chain. On this runtime it completed 2,220 levels and failed at 2,221. `deep-copy` uses a work stack instead of recursion, so depth is bounded by memory.

The copy of a flat object is dominated by the cost of creating an object
with one million properties. `structuredClone` is about twice as slow on
that shape. The nested records show the effect of the traversal itself:
without the generator objects of the previous version, the copy needs about
half the temporary memory and runs twice as fast.

The circular-reference checks cost little on a flat object, because there
is only one container to keep track of. They cost about 8% on the nested
records, where the ancestors of every container have to be tracked. The
deep chain shows the largest relative difference, because every level of
it needs a lookup, but the difference stays below half a millisecond.
Switch the checks off when the data is known to be acyclic.

The [memory benchmark](benchmarks/memory.mjs) measures the heap of the same
three inputs in fresh processes:

```sh
npm run benchmark:memory
```

| Structure | Input heap | Temporary heap of v2.0.0 | Temporary heap now | Retained copy |
| --- | ---: | ---: | ---: | ---: |
| Flat object | 77.76 | 108.46 | 108.46 | 48.01 |
| Nested records | 12.97 | 82.55 | 42.35 | 29.12 |
| Deep chain | 0.13 | 1.13 | 0.88 | 0.22 |

All values are MiB. The temporary heap is the extra heap right after the
copy, before a collection. It holds the result and everything the
traversal left behind. The retained copy is the extra heap that stays
while the result is kept. These figures describe one machine and one
runtime; measure your own workload.



## Links
- [Release history](Changelog.md)
- [Walk: A deep copy with a callbacks for modifying values.](https://github.com/PeterNaydenov/walk)
- [Dt-toolbox: Execute more complex operations over data structures.](https://github.com/PeterNaydenov/dt-toolbox)



## Credits
'@peter.naydenov/deep-copy' was created and supported by Peter Naydenov.



## License
'@peter.naydenov/deep-copy' is released under the [MIT License](http://opensource.org/licenses/MIT).

