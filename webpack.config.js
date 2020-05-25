const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin    = require('copy-webpack-plugin');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');

module.exports = {
  context: __dirname + '/src',
  mode: 'production',
  entry: {
    'popup/popup'              : './popup/popup.js',
    'options/options'          : './options/options.js',
    'background/background'    : './background/background.js',
    'background/upgrade'       : './background/upgrade.js',
    'background/keyboard'      : './background/keyboard.js',
    'background/page_actions'  : './background/page_actions.js',
    'background/context_menus' : './background/context_menus.js',
    'background/uninstall'     : './background/uninstall.js'
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
      { from: 'assets/', to: 'assets/',  ignore: ['.DS_Store'] },
      { from: 'manifest.json', to: 'manifest.json' }
    ]),
    // TODO: I'd need this only when generating a new production build
    // https://docs.sentry.io/platforms/javascript/sourcemaps/#uploading-source-maps-to-sentry
    // new SentryWebpackPlugin({
    //   include: '.',
    //   ignoreFile: '.sentrycliignore',
    //   ignore: ['node_modules', 'webpack.config.js'],
    //   configFile: 'sentry.properties'
    // })
  ]
};
