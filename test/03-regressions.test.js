import { expect } from 'chai'
import vm from 'node:vm'
import deepCopy from '../src/main.js'

describe ( 'Regression cases', () => {
    it ( 'preserves sparse array lengths at the root and in nested arrays', () => {
        for ( const source of [ Array ( 3 ), [ 1, , ], [ 1, , 3, , , ] ] ) {
            for ( const result of [ deepCopy ( source ), deepCopy ( { source } ).source ] ) {
                expect ( result.length ).to.equal ( source.length )
                expect ( Object.keys ( result ) ).to.deep.equal ( Object.keys ( source ) )
            }
        }
    })

    it ( 'ignores symbol keys while copying enumerable string keys', () => {
        const key = Symbol ( 'key' )
        const source = { value:1, [key]:2 }
        const result = deepCopy ( source )
        expect ( result.value ).to.equal ( 1 )
        expect ( Object.hasOwn ( result, key ) ).to.equal ( false )
    })

    it ( 'retains built-ins from other realms and other built-in types', () => {
        const foreign = vm.runInNewContext ( '({ date:new Date(0), map:new Map([[1,2]]), data:new Uint8Array([1,2]) })' )
        const values = [ ...Object.values ( foreign ), new Error ( 'message' ), new URL ( 'https://example.com/' ), Promise.resolve ( 1 ), Object ( 3 ) ]
        for ( const value of values ) {
            expect ( deepCopy ( value ) ).to.equal ( value )
            expect ( deepCopy ( { value } ).value ).to.equal ( value )
        }
    })

    it ( 'copies class instances with a nodeType property', () => {
        class Record { constructor () { this.nodeType = 1; this.child = { value:1 } } }
        const source = new Record ()
        const result = deepCopy ( source )
        expect ( result ).not.to.equal ( source )
        expect ( result.child ).not.to.equal ( source.child )
        expect ( result.nodeType ).to.equal ( 1 )
    })

    it ( 'preserves JSON keys that also exist on Object.prototype', () => {
        const source = JSON.parse ( '{"__proto__":{"nested":1},"constructor":{"value":2},"toString":"data"}' )
        const result = deepCopy ( source )
        expect ( Object.getPrototypeOf ( result ) ).to.equal ( Object.prototype )
        expect ( Object.hasOwn ( result, '__proto__' ) ).to.equal ( true )
        expect ( result.__proto__ ).to.deep.equal ( { nested:1 } )
        expect ( result.__proto__ ).not.to.equal ( source.__proto__ )
        expect ( result.constructor ).to.deep.equal ( { value:2 } )
        expect ( result.toString ).to.equal ( 'data' )
    })

    it ( 'preserves cycles through a deep ancestor lookup', () => {
        const source = {}, root = source
        let current = source
        for ( let index = 0; index < 40; index++ ) current = current.next = {}
        current.root = root
        let result = deepCopy ( source ), leaf = result
        for ( let index = 0; index < 40; index++ ) leaf = leaf.next
        expect ( leaf.root ).to.equal ( result )
    })
})
