'use strict';
const fs = require('fs');
const autoprefixer = require('autoprefixer');
const path = require('path');
const webpack = require('webpack');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const eslintFormatter = require('react-dev-utils/eslintFormatter');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin")


const getClientEnvironment = require('./env');
const paths = require('./paths');

const env = getClientEnvironment(publicUrl);
const appPackageJson = require(paths.appPackageJson);
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
    mode: env.stringified.NODE_ENV,
    devtool: 'cheap-module-source-map',
    plugins: [
        new MiniCssExtractPlugin({ filename:  appPackageJson.name + '.css' })
    ],
    entry: [
        paths.appIndexJs
    ],
    output: {
        filename: appPackageJson.name + '.js',
        path: path.join(appDirectory, "/dist/"),
        library: "MKApp_" + appPackageJson.name.replace(/-/g, '_'),
        libraryTarget: "umd"
    },
    resolve: {
        extensions: [".js"]
    },
    externals: {
        "react": {
            root: 'React',
            commonjs2: 'react',
            commonjs: 'react',
            amd: 'react'
        },
        "react-dom": {
            root: 'ReactDOM',
            commonjs2: 'react-dom',
            commonjs: 'react-dom',
            amd: 'react-dom'
        },
        "immutable": {
            root: 'Immutable',
            commonjs2: 'immutable',
            commonjs: 'immutable',
            amd: 'immutable'
        },
        "moment": "moment",
        "mk-sdk": "MK",
        "mk-app-loader": {
            root: ["MK", "appLoader"],
            commonjs: "MK.appLoader",
            commonjs2: "MK.appLoader",
            amd: "MK.appLoader"
        },
        "mk-utils": {
            root: ["MK", "utils"],
            commonjs2: "MK.utils",
            amd: "MK.utils",
            commonjs: "MK.utils",
        },
        "mk-component": {
            root: ["MK", "component"],
            commonjs2: "MK.component",
            amd: "MK.component",
            commonjs: "MK.component"
        },
        "mk-meta-engine": {
            commonjs: ["MK", "metaEngine"],
            commonjs2: "MK.metaEngine",
            amd: "MK.metaEngine",
            root: "MK.metaEngine"
        },
        "mk-aar-form": "mk-aar-form",
        "mk-aar-grid": "mk-aar-grid"
    },
    module: {
        rules: [{
            test: /\.js?$/,
            exclude: /node_modules/,
            use: 'babel-loader'
        }, {
            test: /\.css$/,
            use: [MiniCssExtractPlugin.loader, 'css-loader']
        }, {
            test: /\.less$/,
            use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']

        }, {
            test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif|mp4|webm)(\?\S*)?$/,
            use: {
                loader: 'url-loader',
                options: {
                    name: '[name].[ext]',
                    limit: 8192
                }
            }
        }],
    },
    plugins: [
        new webpack.DefinePlugin(env.stringified),
        new webpack.HotModuleReplacementPlugin(),
        //大小写匹配
        new CaseSensitivePathsPlugin(),
        new WatchMissingNodeModulesPlugin(paths.appNodeModules),
    ],
    node: {
        dgram: 'empty',
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
        child_process: 'empty',
    },

    //关闭性能提示
    performance: {
        hints: false,
    },
};
