'use strict';

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

//promise未处理reject的异常
process.on('unhandledRejection', err => {
    throw err;
});

require('../config/env');

const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const webpack = require('webpack');
const config = require('../config/webpack.config.pkg.dev');
const paths = require('../config/paths');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const printBuildError = require('react-dev-utils/printBuildError');
const template = require('art-template');

const measureFileSizesBeforeBuild =
    FileSizeReporter.measureFileSizesBeforeBuild;

const appDirectory = fs.realpathSync(process.cwd());

const appJson = require(paths.appPackageJson);

// 检测必须的文件，不存在自动退出
if (!checkRequiredFiles([paths.appIndexJs])) {
    process.exit(1);
}

measureFileSizesBeforeBuild(paths.appPackage)
    .then(previousFileSizes => {
        //清空目录中文件
        fs.emptyDirSync(paths.appPackageDev);
        //开始build
        let ret = build(previousFileSizes);
        let libPath = path.resolve(appDirectory, 'node_modules', 'mk-sdk', 'dist', 'debug')
        if (!fs.existsSync(paths.appPackageDev)) {
            fs.mkdirSync(paths.appPackageDev);
        }
        fs.copySync(libPath, paths.appPackageDev);
        let ownHtmlPath = path.resolve(appDirectory, 'node_modules', 'mk-sdk', 'template', 'app', 'index-dev.html')
        let appHtmlPath = path.resolve(appDirectory, 'template', 'index-dev.html')
        let html = fs.existsSync(appHtmlPath) ? fs.readFileSync(appHtmlPath, 'utf-8') : fs.readFileSync(ownHtmlPath, 'utf-8');
        let render = template.compile(html, { debug: true });
        let htmlOption = appJson.htmlOption
        html = render({
            appName: (htmlOption && htmlOption.renderApp) || appJson.name,
            title: appJson.description,
            isMock: (htmlOption && htmlOption.isMock) || false,
            token:  (htmlOption && htmlOption.token) || '',
            preApp: (htmlOption && htmlOption.preApp && htmlOption.preApp.length > 0)
                ? JSON.stringify(htmlOption.preApp)
                : '',
            app: JSON.stringify({
                ...(htmlOption && htmlOption.app),
                [appJson.name]: { asset: appJson.name }
            }),

        });
        fs.writeFileSync(path.resolve(paths.appPackageDev, 'index.html'), html);

        return ret
    })
    .then(
        ({ stats, previousFileSizes, warnings }) => {
            //存在警告
            if (warnings.length) {
                console.log(chalk.yellow('打包警告.\n'));
                console.log(warnings.join('\n\n'));
            } else {
                console.log(chalk.green('打包成功.'));
            }
        },
        err => {
            console.log(chalk.red('打包失败.\n'));
            //输出编译异常
            printBuildError(err);
            process.exit(1);
        }
    );


function build(previousFileSizes) {
    console.log('打包开发环境资源...');
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

