import { defineConfig } from 'vite';


// Vite builds with Rolldown. The module resolution is built in, so no
// extra plugin is needed. The package has no runtime dependencies and
// 'src/main.js' imports nothing.
//
// The build target is ES2015. The library needs 'Map' from ES2015, and
// the syntax is transpiled down to it, so the bundles run in every
// browser of the 'browserslist' section.

export default defineConfig ({
      build: {
            lib: {
                  entry    : 'src/main.js'
                , name     : 'deepCopy'
                , formats  : [ 'es', 'cjs', 'umd' ]
                , fileName : format => format === 'es'  ? 'deep-copy.esm.mjs'
                                : format === 'cjs' ? 'deep-copy.cjs'
                                : 'deep-copy.umd.js'
            }
        , target   : 'es2015'
        , minify  : true
      }
})
