'use strict';

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

process.on('unhandledRejection', err => {
    throw err;
});

require('../config/env');

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const openBrowser = require('react-dev-utils/openBrowser');
const paths = require('../config/paths');
const config = require('../config/webpack.config.start');
const createDevServerConfig = require('../config/webpackDevServer.config');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const template = require('art-template');
const spawn = require('react-dev-utils/crossSpawn');
const {
    choosePort,
    createCompiler,
    prepareProxy,
    prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');

createDir(paths.appPublic)
    .then(() => copyCoreLib(paths.appPublic, paths.appPath))
    .then(() => scanAppDep(paths.appPath))
    .then(() => copyLocalDep(paths.appPath))
    .then(() => copyRemoteDep(paths.appPath))
    .then(() => createHtmlFile(paths.appPublic, paths.appPath))
    .then(() => getServerOption(paths.appPath))
    .then(option => {
        return new Promise((resolve, reject) => {
            choosePort(option.host, option.port).then(port => {

                resolve({ ...option, port })
            })
        })
    })
    .then(option => startServer(option))
    .catch(err => {
        if (err && err.message) {
            console.log(err)
        }
        process.exit(1);
    })


function createDir(publicPath) {
    return new Promise((resolve, reject) => {

        if (!fs.existsSync(publicPath)) {
            fs.mkdirSync(publicPath);
        }
        else {
            //清空目录中文件
            fs.emptyDirSync(publicPath);
        }
        resolve()
    })
}

function copyCoreLib(publicPath, appPath) {
    return new Promise((resolve, reject) => {
        const coreLibPath = path.resolve(appPath, 'node_modules', 'mk-sdk', 'dist', 'debug');
        fs.copySync(coreLibPath, publicPath);
        resolve();
    })
}

function scanAppDep(appPath) {
    return new Promise((resolve, reject) => {
        spawn.sync('node',
            [path.resolve(appPath, 'node_modules', 'mk-command', 'scripts', 'scan.js')],
            { stdio: 'inherit' }
        );
        resolve()
    })
}

function copyLocalDep(appPath) {
    return new Promise((resolve, reject) => {
        spawn.sync('node',
            [path.resolve(appPath, 'node_modules', 'mk-command', 'scripts', 'copy-local-dep.js')],
            { stdio: 'inherit' }
        );
        resolve();
    })
}

function copyRemoteDep(appPath) {
    return new Promise((resolve, reject) => {
        spawn.sync('node',
            [path.resolve(appPath, 'node_modules', 'mk-command', 'scripts', 'copy-remote-dep.js')],
            { stdio: 'inherit' }
        );
        resolve();
    })
}

function createHtmlFile(publicPath, appPath) {
    return new Promise((resolve, reject) => {

        const htmlTplPath = path.resolve(appPath, 'index.html');
        let html = fs.readFileSync(htmlTplPath, 'utf-8');
        let render = template.compile(html);
        let packageJson = JSON.parse(fs.readFileSync(path.join(appPath, 'package.json'), 'utf-8'))
        let mkJson = JSON.parse(fs.readFileSync(path.join(appPath, 'mk.json'), 'utf-8'))
        html = render({ ...packageJson, ...mkJson, dev: true });
        fs.writeFileSync(path.resolve(publicPath, 'index.html'), html);
        resolve();
    })
}

function getServerOption(appPath) {
    return new Promise((resolve, reject) => {
        const mkJson = JSON.parse(fs.readFileSync(path.join(appPath, 'mk.json'), 'utf-8'))
        const serverOption = mkJson.server
        const DEFAULT_PORT = parseInt(serverOption.port, 10) || 8000
        const HOST = serverOption.host || '0.0.0.0'
        resolve({
            port: DEFAULT_PORT,
            host: HOST,
            serverOption
        })
    })
}

function startServer(option) {
    const serverOption = option.serverOption
    const port = option.port
    const host = option.host
    if (port == null) {
        // 没有端口直接返回
        return;
    }


    const protocol = serverOption.https === 'true' ? 'https' : 'http';
    const appName = require(paths.appPackageJson).name;
    const urls = prepareUrls(protocol, host, port);
    config.entry = path.resolve(paths.ownPath, 'template', 'empty.js')
    // 创建webpack编译器
    const compiler = createCompiler(webpack, config, appName, urls, true);
    // 加载代理配置
    const proxySetting = serverOption.proxy;
    const proxyConfig = prepareProxy(proxySetting, paths.appPublic);
    // 服务器配置
    const serverConfig = createDevServerConfig(
        proxyConfig,
        urls.lanUrlForConfig
    );

    const devServer = new WebpackDevServer(compiler, serverConfig);
    // 启动服务器
    devServer.listen(port, host, err => {
        if (err) {
            return console.log(err);
        }

        clearConsole();
        console.log(chalk.cyan('启动服务器...\n'));
        //openBrowser(urls.localUrlForBrowser);
    });

    ['SIGINT', 'SIGTERM'].forEach(function (sig) {
        process.on(sig, function () {
            devServer.close();
            process.exit();
        });
    });

}