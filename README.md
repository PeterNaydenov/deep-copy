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



**Installation for browsers**: Execute script '`npm run build`' in the console. Then grab file "`dist/deep-copy.min.js`" and put it inside the project. Request the file from HTML page. Global variable 'deepCopy' is available for use.


            Note:
            Library is using 'generator functions'. If support for old browsers 
            is required, add a polyfill for 'generators'.










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





## Links
- [Release history](Changelog.md)
- [Dt-toolbox: Execute more complex operations over data structures.](https://github.com/PeterNaydenov/dt-toolbox)



## Credits
'@peter.naydenov/deep-copy' was created and supported by Peter Naydenov.



## License
'@peter.naydenov/deep-copy' is released under the [MIT License](http://opensource.org/licenses/MIT).

