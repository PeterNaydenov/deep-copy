/**
 *     deepCopy
 *
 *     Creates an immutable copy of a javascript data structure.
 *
 *     The traversal is iterative. Containers are kept on an explicit stack
 *     instead of being copied through nested generator functions, so the
 *     cost of a copy does not grow with the depth of the data and the
 *     depth of the data is bounded by memory instead of by the call stack.
 *
 *     History notes:
 *        - Development started on January 8th, 2022
 *        - Published on GitHub for first time: January 9th, 2022
 *        - Iterative traversal. October 28th, 2026
 */



/**
 *  Optional controls for the traversal.
 *
 *  @typedef {object} Settings
 *  @property {boolean} [detectCycles] - Defaults to true. Only false skips the
 *  circular-reference checks and their bookkeeping. Use it when the data is
 *  known to be acyclic. With the checks off, a circular structure does not
 *  end the copy; it fills the memory instead.
 */



// Ancestors of the container being visited are found with a linear scan
// while the chain is short. Deeper structures switch to a map lookup, so
// the cost of one container does not grow with the depth of the data.
const SCAN_LIMIT = 32;
const SCAN_LIMIT_2 = SCAN_LIMIT * 2;

const SIMPLE = 0;   // A value kept as it is.
const OBJECT = 1;   // A plain object.
const ARRAY  = 2;   // An array.



function findType ( x ) {
    if ( x === null || x === undefined )   return SIMPLE // null and undefined
    if ( typeof x !== 'object' )           return SIMPLE // number, bigint, string, boolean, symbol, function
    if ( Array.isArray ( x ) )             return ARRAY
    const proto = Object.getPrototypeOf ( x );
    if ( proto === null || proto === Object.prototype )   return OBJECT // plain object

    // Built-in object types keep their data outside the own-enumerable-string-key
    // model used here. They are preserved by reference, so nothing is lost.
    if ( x.nodeType )                                       return SIMPLE // DOM node
    if ( x instanceof Date )                                return SIMPLE
    if ( x instanceof RegExp )                              return SIMPLE
    if ( x instanceof Map )                                 return SIMPLE
    if ( x instanceof Set )                                 return SIMPLE
    if ( x instanceof WeakMap )                             return SIMPLE
    if ( x instanceof WeakSet )                             return SIMPLE
    if ( x instanceof ArrayBuffer )                         return SIMPLE
    if ( x instanceof DataView )                            return SIMPLE
    if ( ArrayBuffer.isView ( x ) )                         return SIMPLE // Typed arrays
    return OBJECT // Class instances and other exotic objects
} // findType func.



// Plain assignment of a '__proto__' key triggers the inherited setter and
// replaces the prototype of 'target' instead of creating an own property.
function setKey ( target, k, value ) {
    Object.defineProperty ( target, k, { value, enumerable:true, writable:true, configurable:true } )
} // setKey func.



/**
 *  Deep copy
 *
 *  Copies a javascript data structure into a new one. Plain objects and
 *  arrays are copied, values that keep their data outside of own enumerable
 *  keys are kept by reference.
 *
 *  A circular reference points to the copy of the container it closes the
 *  circle with. Set `settings.detectCycles` to false when the data is known
 *  to be acyclic. The checks are skipped then, and the copy of a circular
 *  structure does not end.
 *
 *  @function deepCopy
 *  @param {*}       origin  - Required. The data structure to copy.
 *  @param {Settings} [settings] - Optional. Controls for the traversal.
 *  @returns {*}              - The copy of `origin`.
 *  @example
 *  let result = deepCopy ( someData )
 *  let fast   = deepCopy ( someData, { detectCycles:false } )
 */
function deepCopy ( origin, settings ) {
    const rootType = findType ( origin );
    if ( rootType === SIMPLE )   return origin;

    const detectCycles = settings?.detectCycles !== false;
    const root = rootType === ARRAY ? [] : {};

    // Containers waiting to be copied. Each entry holds the source container
    // and the copy that receives its values. A null source marks the end of a
    // container, so the ancestor chain can be unwound after its children.
    const sources = [origin];
    const targets = [root];

    // Ancestors of the container being visited, as alternating source/copy
    // pairs. Only the branch of the current container is kept.
    const chain = [];
    let top = 0;            // Entries of the chain in use.
    let lookup = null;      // Map of the chain, used when the chain grows deep

    while ( sources.length ) {
        const source = sources.pop();
        const target = targets.pop();

        if ( source === null ) {          // End of a container
                if ( lookup )   lookup.delete ( chain[top-2] );
                top -= 2;
                if ( top <= SCAN_LIMIT_2 )   lookup = null;
                continue;
            }

        if ( detectCycles ) {
                chain[top] = source;
                chain[top+1] = target;
                top += 2;
                if ( top > SCAN_LIMIT_2 ) {
                        if ( !lookup ) {
                                lookup = new Map ();
                                for ( let index = 0; index < top; index += 2 )   lookup.set ( chain[index], chain[index+1] )
                            }
                        else   lookup.set ( source, target );
                    }

                sources.push ( null );       // End marker. Pushed before the children,
                targets.push ( null );       // so the children are visited first.
            }

        const keys = Object.keys ( source );
        const length = keys.length;

        for ( let index = 0; index < length; index++ ) {
                const key = keys[index];
                const value = source[key];

                if ( value === null || typeof value !== 'object' ) {
                        if ( key === '__proto__' )   setKey ( target, key, value )
                        else                        target[key] = value
                        continue
                    }

                // A container gets an empty copy of its own type. Built-in
                // objects keep their data outside that model, so they are
                // preserved by reference.
                let child;
                let keep = false;
                if ( Array.isArray ( value ) ) {
                        child = [];
                    }
                else {
                        const proto = Object.getPrototypeOf ( value );
                        if ( proto === null || proto === Object.prototype )   child = {};
                        else if ( findType ( value ) === SIMPLE ) { child = value; keep = true }
                        else                                                child = {};
                    }

                if ( keep ) {
                        if ( key === '__proto__' )   setKey ( target, key, value )
                        else                        target[key] = value
                        continue
                    }

                // A container that is an ancestor of the current one closes a
                // circle. It points to the copy of that ancestor.
                if ( detectCycles ) {
                        let ancestor;
                        if ( lookup ) {
                                ancestor = lookup.get ( value );
                            }
                        else {
                                ancestor = undefined;
                                for ( let position = top - 2; position >= 0; position -= 2 ) {
                                        if ( chain[position] === value ) { ancestor = chain[position+1]; break }
                                    }
                            }
                        if ( ancestor !== undefined ) {
                                if ( key === '__proto__' )   setKey ( target, key, ancestor )
                                else                        target[key] = ancestor
                                continue
                            }
                    }

                if ( key === '__proto__' )   setKey ( target, key, child )
                else                        target[key] = child;
                sources.push ( value );
                targets.push ( child );
            }
    } // while sources

    return root;
} // deepCopy func.



export default deepCopy
