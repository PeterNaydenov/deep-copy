"use strict"

import { expect } from 'chai'
import deepCopy from '../src/main.js'

describe ( 'Deep copy - edge cases', () => {

    it ( 'Copy a null and an undefined value', () => {
                expect ( deepCopy ( null ) ).to.be.equal ( null )
                expect ( deepCopy ( undefined ) ).to.be.equal ( undefined )
        }) // it copy a null and an undefined value



    it ( 'Copy a function by reference', () => {
                const fn = () => 42
                expect ( deepCopy ( fn ) ).to.be.equal ( fn )
                expect ( deepCopy ( { fn } ).fn ).to.be.equal ( fn )
        }) // it copy a function by reference



    it ( 'Copy a symbol and a bigint', () => {
                const symbol = Symbol ( 'key' )
                const big = 10n
                expect ( deepCopy ( { symbol, big } ).symbol ).to.be.equal ( symbol )
                expect ( deepCopy ( { symbol, big } ).big ).to.be.equal ( big )
        }) // it copy a symbol and a bigint



    it ( 'Copy a nested structure without touching the source', () => {
                const x = { a:{ b:{ c:[1,2,3] } } }
                const r = deepCopy ( x )
                r.a.b.c.push ( 4 )
                x.a.b.c[0] = 99
                expect ( x.a.b.c ).to.have.length ( 3 )
                expect ( r.a.b.c ).to.have.length ( 4 )
                expect ( r.a ).to.not.be.equal ( x.a )
                expect ( r.a.b.c ).to.not.be.equal ( x.a.b.c )
        }) // it copy a nested structure



    it ( 'Copy a container that is used in two places', () => {
                const shared = { value:1 }
                const x = { first:shared, second:shared }
                const r = deepCopy ( x )
                expect ( r.first ).to.not.be.equal ( shared )
                expect ( r.second ).to.not.be.equal ( shared )
                expect ( r.first ).to.not.be.equal ( r.second )
                expect ( r.first.value ).to.be.equal ( 1 )
                expect ( r.second.value ).to.be.equal ( 1 )
        }) // it copy a container that is used in two places



    it ( 'Copy a structure with a circular reference', () => {
                const x = { name:'root' }
                x.self = x
                x.child = { parent:x }
                const r = deepCopy ( x )
                expect ( r ).to.not.be.equal ( x )
                expect ( r.name ).to.be.equal ( 'root' )
                expect ( r.self ).to.be.equal ( r )
                expect ( r.child.parent ).to.be.equal ( r )
                expect ( r.child ).to.not.be.equal ( x.child )
        }) // it copy a structure with a circular reference



    it ( 'Copy a circular reference inside an array', () => {
                const x = [ 'first' ]
                x.push ( x )
                const r = deepCopy ( x )
                expect ( r ).to.not.be.equal ( x )
                expect ( r ).to.have.length ( 2 )
                expect ( r[0] ).to.be.equal ( 'first' )
                expect ( r[1] ).to.be.equal ( r )
        }) // it copy a circular reference inside an array



    it ( 'Copy a deeply nested structure without a stack overflow', () => {
                let x = { leaf:1 }
                for ( let index = 0; index < 50000; index++ )   x = { child:x }
                const r = deepCopy ( x )
                let current = r, depth = 0
                while ( current.child ) { current = current.child; depth++ }
                expect ( depth ).to.be.equal ( 50000 )
                expect ( current.leaf ).to.be.equal ( 1 )
        }) // it copy a deeply nested structure



    it ( 'Keep built-in objects by reference', () => {
                const date = new Date ( 0 )
                const regexp = /abc/g
                const map = new Map ([ ['a',1] ])
                const set = new Set ( [1,2] )
                const buffer = new ArrayBuffer ( 8 )
                const view = new DataView ( buffer )
                const typed = new Uint8Array ([1,2,3])
                const r = deepCopy ( { date, regexp, map, set, buffer, view, typed } )
                expect ( r.date ).to.be.equal ( date )
                expect ( r.regexp ).to.be.equal ( regexp )
                expect ( r.map ).to.be.equal ( map )
                expect ( r.set ).to.be.equal ( set )
                expect ( r.buffer ).to.be.equal ( buffer )
                expect ( r.view ).to.be.equal ( view )
                expect ( r.typed ).to.be.equal ( typed )
        }) // it keep built-in objects by reference



    it ( 'Keep the weak collections and the array buffers by reference', () => {
                const weakMap = new WeakMap ()
                const weakSet = new WeakSet ()
                const buffer = new ArrayBuffer ( 8 )
                const r = deepCopy ( { weakMap, weakSet, buffer, view:new DataView ( buffer ) } )
                expect ( r.weakMap ).to.be.equal ( weakMap )
                expect ( r.weakSet ).to.be.equal ( weakSet )
                expect ( r.buffer ).to.be.equal ( buffer )
                expect ( r.view.buffer ).to.be.equal ( buffer )
        }) // it keep the weak collections and the array buffers by reference



    it ( 'Keep a DOM node by reference', () => {
                const node = Object.create ( { nodeType:1, nodeName:'DIV', [Symbol.toStringTag]:'HTMLDivElement' } )
                const r = deepCopy ( { node } )
                expect ( r.node ).to.be.equal ( node )
                expect ( r.node.nodeName ).to.be.equal ( 'DIV' )
        }) // it keep a DOM node by reference



    it ( 'Copy a class instance as a plain object', () => {
                class Point {
                        constructor ( x, y ) { this.x = x; this.y = y }
                }
                const r = deepCopy ( { point:new Point ( 1, 2 ) } )
                expect ( r.point ).to.not.be.instanceOf ( Point )
                expect ( r.point.x ).to.be.equal ( 1 )
                expect ( r.point.y ).to.be.equal ( 2 )
        }) // it copy a class instance as a plain object



    it ( 'Copy a sparse array without filling the gaps', () => {
                const x = [ 1, , 3 ]
                x.extra = 'value'
                const r = deepCopy ( x )
                expect ( r ).to.have.length ( 3 )
                expect ( 1 in r ).to.be.false
                expect ( r[0] ).to.be.equal ( 1 )
                expect ( r[2] ).to.be.equal ( 3 )
                expect ( r.extra ).to.be.equal ( 'value' )
        }) // it copy a sparse array without filling the gaps



    it ( 'Copy a "__proto__" key as an own property', () => {
                const x = JSON.parse ( '{"__proto__":{"polluted":true},"key":1}' )
                const r = deepCopy ( x )
                expect ( Object.getPrototypeOf ( r ) ).to.be.equal ( Object.prototype )
                expect ( Object.prototype.hasOwnProperty.call ( r, '__proto__' ) ).to.be.true
                expect ( r.polluted ).to.be.equal ( undefined )
                expect ( r.key ).to.be.equal ( 1 )
        }) // it copy a "__proto__" key as an own property



    it ( 'Copy a "__proto__" key that holds a value', () => {
                const x = {}
                Object.defineProperty ( x, '__proto__', { value:'text', enumerable:true, writable:true, configurable:true } )
                const r = deepCopy ( x )
                expect ( Object.getPrototypeOf ( r ) ).to.be.equal ( Object.prototype )
                expect ( Object.prototype.hasOwnProperty.call ( r, '__proto__' ) ).to.be.true
                expect ( r.__proto__ ).to.be.equal ( 'text' )
        }) // it copy a "__proto__" key that holds a value



    it ( 'Copy a "__proto__" key that holds a built-in object', () => {
                const date = new Date ( 0 )
                const x = {}
                Object.defineProperty ( x, '__proto__', { value:date, enumerable:true, writable:true, configurable:true } )
                const r = deepCopy ( x )
                expect ( Object.getPrototypeOf ( r ) ).to.be.equal ( Object.prototype )
                expect ( Object.prototype.hasOwnProperty.call ( r, '__proto__' ) ).to.be.true
                expect ( r.__proto__ ).to.be.equal ( date )
        }) // it copy a "__proto__" key that holds a built-in object



    it ( 'Copy a "__proto__" key that closes a circle', () => {
                const x = { name:'root' }
                Object.defineProperty ( x, '__proto__', { value:x, enumerable:true, writable:true, configurable:true } )
                const r = deepCopy ( x )
                expect ( Object.getPrototypeOf ( r ) ).to.be.equal ( Object.prototype )
                expect ( Object.prototype.hasOwnProperty.call ( r, '__proto__' ) ).to.be.true
                expect ( r.__proto__ ).to.be.equal ( r )
                expect ( r.name ).to.be.equal ( 'root' )
        }) // it copy a "__proto__" key that closes a circle



    it ( 'Copy an object without a prototype', () => {
                const x = Object.assign ( Object.create ( null ), { key:1 } )
                const r = deepCopy ( x )
                expect ( r.key ).to.be.equal ( 1 )
                expect ( Object.getPrototypeOf ( r ) ).to.be.equal ( Object.prototype )
        }) // it copy an object without a prototype



    it ( 'Copy an array with named properties', () => {
                const x = [ 'a', 'b' ]
                x.named = 'value'
                const r = deepCopy ( x )
                expect ( r ).to.have.length ( 2 )
                expect ( r[0] ).to.be.equal ( 'a' )
                expect ( r.named ).to.be.equal ( 'value' )
        }) // it copy an array with named properties



    it ( 'Keep the order of the keys', () => {
                const x = { b:1, a:2, 3:3, c:4 }
                const r = deepCopy ( x )
                expect ( Object.keys ( r ) ).to.deep.equal ( Object.keys ( x ) )
                expect ( Object.keys ( r ) ).to.deep.equal ( [ '3', 'b', 'a', 'c' ] )
        }) // it keep the order of the keys



    it ( 'Copy the same way when the cycle checks are switched off', () => {
                const x = {
                          ls   : [ 1,2,3 ]
                        , name : 'Peter'
                        , props : {
                                      eyeColor: 'blue'
                                    , age     : 47
                                    , sizes   : [12,33,12,21]
                                }
                    }
                const withChecks = deepCopy ( x )
                const withoutChecks = deepCopy ( x, { detectCycles:false } )
                expect ( withoutChecks ).to.deep.equal ( withChecks )
                expect ( withoutChecks.props.sizes ).to.not.be.equal ( x.props.sizes )
                expect ( withoutChecks.ls ).to.not.be.equal ( x.ls )
        }) // it copy the same way when the cycle checks are switched off



    it ( 'Switch the cycle checks off with a false value', () => {
                const x = { a:{ b:[1,2] } }
                const r = deepCopy ( x, { detectCycles:false } )
                expect ( r ).to.deep.equal ( { a:{ b:[1,2] } } )
                expect ( r.a ).to.not.be.equal ( x.a )
        }) // it switch the cycle checks off with a false value



    it ( 'Keep the cycle checks on when they are asked for', () => {
                const x = { name:'root' }
                x.self = x
                const r = deepCopy ( x, { detectCycles:true } )
                expect ( r.self ).to.be.equal ( r )
                const withDefault = deepCopy ( x, {} )
                expect ( withDefault.self ).to.be.equal ( withDefault )
        }) // it keep the cycle checks on when they are asked for

}) // describe
