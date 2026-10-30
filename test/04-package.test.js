import { expect } from 'chai'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import esm from '@peter.naydenov/deep-copy'

const require = createRequire ( import.meta.url )
const cjs = require ( '@peter.naydenov/deep-copy' )
const browser = {}
vm.runInNewContext ( readFileSync ( new URL ( '../dist/deep-copy.umd.js', import.meta.url ), 'utf8' ), browser )

describe ( 'Package entry points', () => {
    for ( const [ name, copy ] of [ [ 'ESM', esm ], [ 'CommonJS', cjs ], [ 'browser UMD', browser.deepCopy ] ] ) {
        it ( `${name} exposes the current implementation`, () => {
            expect ( copy ).to.be.a ( 'function' )
            const shared = { value:1 }
            const symbol = Symbol ( 'not copied' )
            const source = { first:shared, second:shared, sparse:Array ( 3 ), [symbol]:1 }
            Object.defineProperty ( source, '__proto__', { value:{ safe:true }, enumerable:true } )
            source.self = source
            const result = copy ( source )
            expect ( result.first ).not.to.equal ( result.second )
            expect ( result.first ).not.to.equal ( shared )
            expect ( result.self ).to.equal ( result )
            expect ( result.sparse.length ).to.equal ( 3 )
            expect ( Object.hasOwn ( result, symbol ) ).to.equal ( false )
            expect ( Object.hasOwn ( result, '__proto__' ) ).to.equal ( true )
            expect ( result.__proto__.safe ).to.equal ( true )
        })
    }
})
