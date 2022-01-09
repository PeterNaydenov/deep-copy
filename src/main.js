
/**
 *     deepCopy
 * 
 *     Creates an immutable copies of javascript data structures. Library is 
 *     using 'generator functions'. If support for old browsers is required, 
 *     add a polyfill for 'generators'.
 * 
 *     History notes:
 *        - Development started on January 8th, 2021
 *        - Published on GitHub for first time: January 9th, 2021
 *
 */


function deepCopy ( origin ) {
    let 
          type = findType ( origin )
        , result
        , extend = []
        ;
    switch ( type ) {
            case 'array'  :
                                result = []
                                copyObject ( origin, result, extend )
                                break
            case 'object' :
                                result = {}
                                copyObject ( origin, result, extend )
                                break
            case 'simple' :
                                return origin
        } // switch type
    for ( const plus of extend ) {   plus.next() }
    return result
} // deepCopy func.



function findType ( x ) {
    if ( x instanceof Array     ) return 'array'
    if ( typeof x === 'object'  ) return 'object'
    return 'simple'
 } // findType func.



function* generateList ( location, data, ex ) {
    yield copyObject ( data , location, ex )  
} // generateList func.



function copyObject ( obj, result, extend ) {
    let keys = Object.keys ( obj );
    keys.forEach ( k => {
                    const type = findType(obj[k]);
                    if ( type === 'simple' )   result[k] = obj[k]
                    if ( type === 'object' ) {
                            result[k] = {}
                            extend.push ( generateList ( result[k], obj[k], extend )   )
                       }
                    if ( type === 'array' ) {
                            result[k] = []
                            extend.push ( generateList( result[k], obj[k], extend )   )
                        }
            })
} // copyObj func.



module.exports = deepCopy


