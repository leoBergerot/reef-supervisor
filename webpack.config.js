const path = require('path');
const HWP = require('html-webpack-plugin');
module.exports = {
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    filename: 'build.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /asset\/scss\/.*\.scss$/,
        use: ['style-loader', 'sass-loader']
      },
      {
        test: /asset\/images\/.*\.(gif|png|jpe?g|svg)$/i,
        use: [
          'file-loader',
          {
            loader: 'image-webpack-loader',
            options:
              {
                disable: true
              },
          },
        ],
      }
    ]
  },
  plugins:
    [
      new HWP(
        {template: path.resolve(__dirname, 'public/index.html')}
      )
    ],
  devServer: {
    historyApiFallback: true,
    overlay: true,
    port: 9000
  }
};
