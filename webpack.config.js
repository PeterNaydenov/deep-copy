'use strict';

const webpack = require ( 'webpack' );

module.exports = {
      entry: "./src/main.js"
    , mode: 'production'
    , output: {
              filename: "deep-copy.min.js"
            , path: __dirname + "/dist"
            , library: 'deepCopy'
            , libraryTarget: "var"
            , umdNamedDefine : true
       }
    , optimization: {}
    , module: {
          rules: [
                  {
                        test: /\.js$/
                      , exclude: /node_modules/
                      , use : { 
                            loader: 'babel-loader'
                          , options : { presets: ['@babel/preset-env']}
                        }
                    }
                ]
        }
}