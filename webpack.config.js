const path = require('path');
const HWP = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = (env) => {
  const envPath = env.ENVIRONMENT ? `.env.${env.ENVIRONMENT}` : '.env';

  const config = {
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
          use: ['style-loader', 'css-loader', 'sass-loader']
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
          ),
          new Dotenv({
            path: envPath
          })
        ],
    devServer: {
      historyApiFallback: true,
      overlay: true,
      port: 9000
    }
  };

  return config;
};
