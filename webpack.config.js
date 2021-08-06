const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const dataURLs = {
    'local': './',
}

module.exports = env => {
    console.log('ENV', env.dataURL)
    // 通过次代码运行生成bundle.js
    return {
        entry: './src/js/index.js',

        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
        },

        devtool: 'source-map',

        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader"
                    }
                },
                {
                    test: /\.html$/,
                    use: [
                        {
                            loader: "html-loader",
                            options: { minimize: false }
                        }
                    ]
                },
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, "css-loader"]
                },
                {
                    test: /\.(png|svg|jpg|gif)$/,
                    use: [
                        'file-loader'
                    ]
                }
            ],
        },

        plugins: [
            new HtmlWebPackPlugin({
                template: "./index.html", // original location
                filename: "./index.html"  // output in dist
            }),
            new MiniCssExtractPlugin({
                filename: "[name].css",
                chunkFilename: "[id].css"
            }),
            // new CopyWebpackPlugin([
            //     {
            //         from: path.join(__dirname, 'data'),
            //         to: path.join(__dirname, 'dist') + '/data'
            //     }
            // ]),
            new CopyWebpackPlugin([
                {
                    from: path.join(__dirname, 'src/static'),
                    to: path.join(__dirname, 'dist') + '/static'
                }
            ]),
            new webpack.DefinePlugin({
                dataURL: JSON.stringify(dataURLs[env.dataURL])
            })
        ],

        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            compress: false,
            port: 63345
        }
    };
}