const webpack = require( 'webpack' );
const path    = require( 'path' );
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    'popup/popup'     : './popup/popup.js',      // will be  ./build/popup/popup.js,
    'options/options' : './options/options.js',  // will be  ./build/options/options.js
    'background'      : './background.js'        // will be  ./build/background.js
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      // include: path.resolve(__dirname, 'src'),
      exclude: /(node_modules|bower_components)/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: [
            ['es2015', { modules: false }]
          ]
        }
      }]
    },{
      test: /\.scss$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [ 'css-loader', 'sass-loader' ]
      })
    }]
  },
  plugins: [
    new ExtractTextPlugin('[name].css'),
    new CopyWebpackPlugin([
      { from: 'assets/', to: 'assets/' },
      { from: 'manifest.json', to: 'manifest.json' }
    ])
  ]
}

