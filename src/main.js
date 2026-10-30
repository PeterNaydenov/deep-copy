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



/**
 * Options for copying a data structure.
 *
 * @typedef {object} Settings
 * @property {boolean} [detectCycles=true] Detect circular references. Set to
 * false only for acyclic data; copying a cycle without checks does not finish.
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

    // Use the built-in tag rather than instanceof, which fails across realms.
    // Instances tagged as ordinary objects are copied as plain objects. Other
    // tagged values (including DOM nodes) keep their internal data by reference.
    return Object.prototype.toString.call ( x ) === '[object Object]' ? OBJECT : SIMPLE
} // findType func.



// The inherited '__proto__' setter changes the target's prototype. Define
// this JSON key as an own property instead of assigning it.
function setKey ( target, k, value ) {
    Object.defineProperty ( target, k, { value, enumerable:true, writable:true, configurable:true } )
} // setKey func.



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
function deepCopy ( origin, settings ) {
    const rootType = findType ( origin );
    if ( rootType === SIMPLE )   return origin;

    const detectCycles = settings?.detectCycles !== false;
    const root = rootType === ARRAY ? new Array ( origin.length ) : {};

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
                        else                   target[key] = value
                        continue
                    }

                // A container gets an empty copy of its own type. Built-in
                // objects keep their data outside that model, so they are
                // preserved by reference.
                let child;
                let keep = false;
                if ( Array.isArray ( value ) ) {
                        child = new Array ( value.length );
                    }
                else {
                        const proto = Object.getPrototypeOf ( value );
                        if ( proto === null || proto === Object.prototype )   child = {};
                        else if ( findType ( value ) === SIMPLE ) { child = value; keep = true }
                        else                                                child = {};
                    }

                if ( keep ) {
                        if ( key === '__proto__' )   setKey ( target, key, value )
                        else                   target[key] = value
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
                                else                   target[key] = ancestor
                                continue
                            }
                    }

                if ( key === '__proto__' )   setKey ( target, key, child )
                else                   target[key] = child;
                sources.push ( value );
                targets.push ( child );
            }
    } // while sources

    return root;
} // deepCopy func.



export default deepCopy
