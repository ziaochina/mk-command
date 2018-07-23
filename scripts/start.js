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
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');


const useYarn = true; // fs.existsSync(paths.yarnLockFile);
const isInteractive = process.stdout.isTTY;

const measureFileSizesBeforeBuild =
    FileSizeReporter.measureFileSizesBeforeBuild;

const appDirectory = fs.realpathSync(process.cwd());

const appJson = require(paths.appPackageJson);
const mkJson = require(path.join(appDirectory, 'mk.json'));

if (!checkRequiredFiles([paths.appIndexJs])) {
  process.exit(1);
}

measureFileSizesBeforeBuild(paths.appPublic)
  .then(previousFileSizes => {
    let libPath = path.resolve(appDirectory, 'node_modules', 'mk-sdk', 'dist', 'debug')
    if (!fs.existsSync(paths.appPublic)) {
      fs.mkdirSync(paths.appPublic);
    }
    else{
      //清空目录中文件
      fs.emptyDirSync(paths.appPublic);
    }
    fs.copySync(libPath, paths.appPublic);
    let ownHtmlPath = path.resolve(appDirectory, 'node_modules', 'mk-sdk', 'template', 'app', 'index-dev.html')
    let appHtmlPath = path.resolve(appDirectory, 'index.html')
    let html = fs.existsSync(appHtmlPath) ? fs.readFileSync(appHtmlPath, 'utf-8') : fs.readFileSync(ownHtmlPath, 'utf-8');
    let render = template.compile(html);

    let apps = Object.keys(mkJson.dependencies).reduce((a, b) => {
        a[b] = { asset: `${b}.min.js` }
        return a
    }, {})
    apps[appJson.name] = { asset: appJson.name + '.js' }
    html = render({
        rootApp: mkJson.rootApp || appJson.name,
        mkjs: 'mk.js',
        requirejs:'require.js',
        title: appJson.description,
        apps: JSON.stringify(apps),
    });
    fs.writeFileSync(path.resolve(paths.appPublic, 'index.html'), html);

    let serverOption = mkJson.server
    const DEFAULT_PORT = parseInt(serverOption.port, 10) || 8000;
    const HOST = serverOption.host || '0.0.0.0';

    choosePort(HOST, DEFAULT_PORT)
      .then(port => {
        if (port == null) {
          // 没有端口直接返回
          return;
        }
        const protocol = serverOption.https === 'true' ? 'https' : 'http';
        const appName = require(paths.appPackageJson).name;
        const urls = prepareUrls(protocol, HOST, port);
        // 创建webpack编译器
        const compiler = createCompiler(webpack, config, appName, urls, useYarn);
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
        devServer.listen(port, HOST, err => {
          if (err) {
            return console.log(err);
          }
          if (isInteractive) {
            clearConsole();
          }
          console.log(chalk.cyan('启动服务器...\n'));
          //openBrowser(urls.localUrlForBrowser);
        });

        ['SIGINT', 'SIGTERM'].forEach(function (sig) {
          process.on(sig, function () {
            devServer.close();
            process.exit();
          });
        });
      })
      .catch(err => {
        if (err && err.message) {
          console.log(err.message);
        }
        process.exit(1);
      });


  })
  