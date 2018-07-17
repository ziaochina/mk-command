'use strict';

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

process.on('unhandledRejection', err => {
  throw err;
});

require('../config/env');

const fs = require('fs');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const paths = require('../config/paths');
const config = require('../config/webpack.config.dev');
const createDevServerConfig = require('../config/webpackDevServer.config');

const useYarn = fs.existsSync(paths.yarnLockFile);
const isInteractive = process.stdout.isTTY;

if (!checkRequiredFiles([paths.appIndexJs])) {
  process.exit(1);
}

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 8000;
const HOST = process.env.HOST || '0.0.0.0';

choosePort(HOST, DEFAULT_PORT)
  .then(port => {
    if (port == null) {
      // 没有端口直接返回
      return;
    }
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const appName = require(paths.appPackageJson).name;
    const urls = prepareUrls(protocol, HOST, port);
    // 创建webpack编译器
    const compiler = createCompiler(webpack, config, appName, urls, useYarn);
    // 加载代理配置
    const proxySetting = require(paths.appPackageJson).proxy;
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
      openBrowser(urls.localUrlForBrowser);
    });

    ['SIGINT', 'SIGTERM'].forEach(function(sig) {
      process.on(sig, function() {
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
