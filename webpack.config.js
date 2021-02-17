const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin    = require('copy-webpack-plugin');

const base = {
  context: __dirname + '/src',
  mode: 'production',
  devtool: 'source-map',
  entry: {
    'popup/popup'              : './popup/popup.js',
    'options/options'          : './options/options.js',
    'background/sentry'        : './background/sentry.js',
    'background/background'    : './background/background.js',
    'background/upgrade'       : './background/upgrade.js',
    'background/keyboard'      : './background/keyboard.js',
    'background/page_actions'  : './background/page_actions.js',
    'background/context_menus' : './background/context_menus.js',
    'background/uninstall'     : './background/uninstall.js'
  },
  output: {},
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
  plugins: []
};

const firefoxSpecific = {
  output: {
    path: __dirname + '/build/firefox',
    filename: '[name].js'
  },

  plugins: [
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'assets/',
          to: 'assets/',
          globOptions: {
            ignore: ['**/.DS_Store']
          }
        },
        {
          from: 'manifest_firefox.json',
          to: 'manifest.json'
        }
      ]
    })
  ]
}

const chromeSpecific = {
  output: {
    path: __dirname + '/build/chrome',
    filename: '[name].js'
  },

  plugins: [
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'assets/',
          to: 'assets/',
          globOptions: {
            ignore: ['**/.DS_Store']
          }
        },
        {
          from: 'manifest_chrome.json',
          to: 'manifest.json'
        },
        {
          from: '../node_modules/webextension-polyfill/dist/browser-polyfill.js',
          to: 'assets/'
        }
      ]
    })
  ]
}

const firefox = Object.assign({}, base, firefoxSpecific);
const chrome  = Object.assign({}, base, chromeSpecific);

module.exports = [firefox, chrome];
