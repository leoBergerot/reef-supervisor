const path = require('path');
const HWP = require('html-webpack-plugin');

const Dotenv = require('dotenv-webpack');

module.exports = (env) => {
    const envPath = env && env.ENVIRONMENT ? `.env.${env.ENVIRONMENT}` : '.env.dev';
  const config = {
      entry: path.resolve(__dirname, './src/index.js'),
    output: {
        filename: 'build.js',
        path: path.resolve(__dirname, 'build'),
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
            new Dotenv({
                path: envPath
            }),
          new HWP(
              {
                  inject: true,
                  templateParameters: {
                      "PUBLIC_URL": process.env.REACT_APP_PUBLIC_URL,
                  },
                  template: path.resolve(__dirname, 'public/index.html')

              }
          ),
        ],
    devServer: {
      historyApiFallback: true,
        overlay: true,
        port: 9000
    }
  };

  return config;
};
