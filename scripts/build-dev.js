'use strict';

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

//promise未处理reject的异常
process.on('unhandledRejection', err => {
  throw err;
});

require('../config/env');

const chalk = require('chalk');
const fs = require('fs-extra');
const webpack = require('webpack');
const config = require('../config/webpack.config.dev');
const paths = require('../config/paths');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const printBuildError = require('react-dev-utils/printBuildError');

const measureFileSizesBeforeBuild =
  FileSizeReporter.measureFileSizesBeforeBuild;

// 检测必须的文件，不存在自动退出
if (!checkRequiredFiles([paths.appIndexJs])) {
  process.exit(1);
}

measureFileSizesBeforeBuild(paths.appDevBuild)
  .then(previousFileSizes => {
    //清空目录中文件
    fs.emptyDirSync(paths.appDevBuild);
    //开始build
    return build(previousFileSizes);
  })
  .then(
    ({ stats, previousFileSizes, warnings }) => {
      //存在警告
      if (warnings.length) {
        console.log(chalk.yellow('编译警告.\n'));
        console.log(warnings.join('\n\n'));
      } else {
        console.log(chalk.green('编译成功.'));
      }

    },
    err => {
      console.log(chalk.red('编译失败.\n'));
      //输出编译异常
      printBuildError(err);
      process.exit(1);
    }
  );


function build(previousFileSizes) {
  console.log('编译开发环境资源...');

  let compiler = webpack(config);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }
      const messages = formatWebpackMessages(stats.toJson({}, true));

      //存在编译异常
      if (messages.errors.length) {
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join('\n\n')));
      }
      return resolve({
        stats,
        previousFileSizes,
        warnings: messages.warnings,
      });
    });
  });
}

