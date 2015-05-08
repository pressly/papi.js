var webpack = require('webpack'),
    isProduction = process.env.NODE_ENV === 'production',
    plugins = [];

if (isProduction) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({minimize: true})
  );
}

var config = {
    devtool: 'eval',
    entry: [
      './src'
    ],
    resolve: {
      extensions: ['', '.js']
    },
    output: {
        path: __dirname + '/dist',
        filename: "papi.js",
        publicPath: '/dist/'
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader'
        }
      ]
    },
    plugins: plugins
};

module.exports = config;
