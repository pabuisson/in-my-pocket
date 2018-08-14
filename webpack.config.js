const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin    = require('copy-webpack-plugin');

module.exports = {
  context: __dirname + '/src',
  mode: 'production',
  entry: {
    'popup/popup'                : './popup/popup.js',
    'options/options'            : './options/options.js',
    'background'                 : './background.js',
    'upgrade'                    : './upgrade.js',
    'keyboard'                   : './keyboard.js',
    'context_menus_page_actions' : './context_menus_page_actions.js'
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js'
  },
  module: {
    rules: [{
      test: /\.html$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]'
          }
        }
      ]
    }, {
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      use: [
        'babel-loader'
      ]
    },{
      test: /\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        "css-loader", // translates CSS into CommonJS
        "sass-loader" // compiles Sass to CSS, using Node Sass by default
      ]
    }]
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin([
      { from: 'assets/', to: 'assets/',  ignore: [ '.DS_Store' ] },
      { from: 'manifest.json', to: 'manifest.json' }
    ])
  ]
};
