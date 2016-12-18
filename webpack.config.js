module.exports = {
  entry: {
    'build/popup'      : './src/popup/list.js',       // will be  ./build/application/bundle.js,
    'build/options'    : './src/options/options.js',  // will be  ./build/library/bundle.js
    'build/background' : './src/background.js'        // will be  ./build/library/bundle.js
  },
  output: {
    path: './',
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel', // 'babel-loader' is also a valid name to reference
        query: {
          presets: [ 'es2015' ]
        }
      }
    ]
  }
};
