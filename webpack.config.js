const webpack = require('webpack');
const path = require('path');
const WebpackBuildNotifierPlugin = require('webpack-build-notifier');

module.exports = {
  entry: './src/js/app.js',

  output: {
    path: path.resolve(__dirname, 'dual-thermostat'),
    filename: 'dual-thermostat.js',
    publicPath: '/'
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        loader: ['raw-loader']
      }
    ]
  },

  plugins: [
    new webpack.ProvidePlugin({
      jQuery: 'jquery'
    }),
    new WebpackBuildNotifierPlugin({
      title: "Dual Thermostat"
    }),
  ]
};