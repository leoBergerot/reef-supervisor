const path = require('path');
const HWP = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');


const Dotenv = require('dotenv-webpack');

module.exports = (env) => {
    const envPath = env && env.ENVIRONMENT ? `.env.${env.ENVIRONMENT}` : '.env.dev';
    const config = {
        entry: path.resolve(__dirname, './src/index.js'),
        output: {
            filename: 'build.js',
            path: path.resolve(__dirname, 'build'),
            publicPath: "/"
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
                },
                {
                    test: /src\/locales\/.*\.json$/,
                    type: 'javascript/auto',
                    loader: 'json-loader'
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
                        template: path.resolve(__dirname, 'public/index.html')
                    }
                ),
                new CopyPlugin([
                    {from: 'public', to: './'},
                ]),
            ],
        devServer: {
            historyApiFallback: true,
            overlay: true,
            port: 9000,
            publicPath: "/"
        }
    };

    return config;
};
