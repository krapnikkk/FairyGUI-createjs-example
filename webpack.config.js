const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, `./src/main.ts`),
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './dist')
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        //引入模块的时候可以少写后缀
        extensions: ['.tsx', '.ts', '.js']
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: 'dist',
        port: 3000,
        open: true
    },
    plugins: [
    new HtmlWebpackPlugin({
        minify: {
            removeAttributeQuotes: true
        },
        filename: 'index.html',
        template: './index.html',
        inject: 'body'
    })
    ]
}