const webpack = require( 'webpack' );
const path    = require( 'path' );
//
const nodeExternals = require('webpack-node-externals');
const isCoverage = process.env.NODE_ENV === 'coverage';


module.exports = {
  context: path.resolve(__dirname, 'src'),
  module: {
    rules: [].concat(
      isCoverage ? {
        test: /\.js$/,
        include: path.resolve('src'), // instrument only testing sources with Istanbul, after ts-loader runs
        loader: 'istanbul-instrumenter-loader'
      }: [],
      {
        test: /\.js$/,
        // include: path.resolve(__dirname, 'src'),
        exclude: /(node_modules|bower_components)/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              ['env', {
                targets: {
                  browsers: ["firefox >= 45"]
                },
                modules: "commonjs" }]
            ]
          }
        }]
      },
      { test: /\.scss$/, loader: 'null-loader' },
      { test: /\.css$/, loader: 'null-loader' }
    )
  },
  output: {
    // use absolute paths in sourcemaps (important for debugging via IDE)
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
  },
  target: 'node', // webpack should compile node compatible code
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  devtool: "inline-cheap-module-source-map"
};
