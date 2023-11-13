const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')


const config = {
    mode: 'development',
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js',
        clean: true,
    },
    devtool: 'source-map',
    devServer: {
        host: 'localhost',
        port: 7777, // '9999'自定义
        open: true,
        // //静态目录位置
        // static: {
        //     directory: 'dist'
        // }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "public/index.html")
        })
    ]
}

module.exports = config