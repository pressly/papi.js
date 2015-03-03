var entry = './src/app/app.js',
  output = {
    path: __dirname,
    filename: 'app.js'
  };

module.exports.development = {
  debug : true,
  devtool : 'eval',
  entry: entry,
  output: output,
  module : {
    loaders : [
      { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader' }
    ]
  }
};

module.exports.production = {
  debug: false,
  entry: entry,
  output: output,
  module : {
    loaders : [
      { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader' }
    ]
  }
};
