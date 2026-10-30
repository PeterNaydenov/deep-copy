## Release History



### 3.0.1 (2026-10-30)
- [x] The build moved from Rollup to Vite. Vite builds with Rolldown and resolves the modules on its own. The 'rollup' and the three '@rollup/plugin-*' dev dependencies are gone;
- [x] Fix: '@rollup/plugin-node-resolve' was removed from the build. It was not needed, and its 'deepmerge' dependency had a prototype poisoning advisory with no fixed version;
- [x] Fix: The bundles were shipped with the optional chaining of the option check. They are transpiled to ES2015 now and run in every browser of the 'browserslist' section;
- [x] Fix: The browser installation note pointed to a file name that was never built. It is 'dist/deep-copy.umd.js';



### 3.0.0 (2026-10-29)
- [x] Iterative traversal. The copy no longer uses generator functions and no recursion;
- [x] Circular references are supported. A circular reference points to the copy of the container it closes the circle with;
- [x] New option 'detectCycles'. It is true by default. A false value skips the circular-reference checks and their bookkeeping;
- [x] Built-in objects are kept by reference. A Date, RegExp, Map, Set, WeakMap, WeakSet, ArrayBuffer, DataView, typed array or DOM node was replaced with an empty object before and keeps its data now;
- [x] Fix: A '__proto__' key was replacing the prototype of the copy. It is now copied as an own property;
- [x] Fix: 'rollup' was missing from the dev dependencies and the build script could not run;
- [x] Tests for the new behaviour;
- [x] Benchmarks for speed and memory;
- [x] Documentation update;



### 2.0.0 (2024-12-05)
- [x] Convert to ES module;
- [x] Changes in build process. Webpack is replaced with Rollup;
- [x] No change in functionality;



### 1.0.2 (2023-11-05)
- [x] Dev dependencies update;



### 1.0.1 (2022-01-10) 
 - [x] Fix: Wrong main file position in package.json;
 


### 1.0.0 (2022-01-09)
 
 - [x] Initial code;
 - [x] Test package;
 - [x] Documentation;
 - [] Wrong main file position in package.json;



