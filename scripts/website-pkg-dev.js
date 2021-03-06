'use strict';

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

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
const spawn = require('cross-spawn');
const appDirectory = fs.realpathSync(process.cwd());

console.log(chalk.green(`开始打包开发环境网站...`));
emptyDir()
    .then(() => copyCoreLib())
    .then(() => scanAppDep(paths.appPath))
    .then(() => copyLocalDep(paths.appPath))
    .then(() => copyRemoteDep(paths.appPath))
    .then(() => createHtmlFile(paths.appPackageDev, paths.appPath))
    .then(() => {
        console.log(chalk.green(`打包成功,输出目录:${paths.appPackageDev}\n`));
        return Promise.resolve()
    })
    .catch(err => {
        console.log(chalk.red('打包失败.\n'));
        //输出编译异常
        printBuildError(err);
        process.exit(1);
    })

function emptyDir() {
    console.log(`  ${chalk.bold('[1/6]')} 清空目录:${paths.appPackageDev}`)
    return new Promise((resolve, reject) => {
        //清空目录中文件
        fs.emptyDirSync(paths.appPackageDev);
        resolve()
    })
}

function copyCoreLib() {
    console.log(`  ${chalk.bold('[2/6]')} 复制sdk...`)
    let libPath = path.resolve(appDirectory, 'node_modules', 'mk-sdk', 'dist', 'debug')
    if (!fs.existsSync(paths.appPackageDev)) {
        fs.mkdirSync(paths.appPackageDev);
    }
    fs.copySync(libPath, paths.appPackageDev);
}

function scanAppDep(appPath) {
    console.log(`  ${chalk.bold('[3/6]')} 扫描依赖app...`)
    return new Promise((resolve, reject) => {
        spawn.sync('node',
            [path.resolve(appPath, 'node_modules', 'mk-command', 'scripts', 'scan.js')],
            { stdio: 'inherit' }
        );
        resolve()
    })
}

function copyLocalDep(appPath) {
    console.log(`  ${chalk.bold('[4/6]')} 复制本地依赖app...`)
    return new Promise((resolve, reject) => {
        spawn.sync('node',
            [path.resolve(appPath, 'node_modules', 'mk-command', 'scripts', 'copy-local-dep.js'), '', paths.appPackageDev],
            { stdio: 'inherit' }
        );
        resolve();
    })
}

function copyRemoteDep(appPath) {

    console.log(`  ${chalk.bold('[5/6]')} 复制远程依赖app...`)
    return new Promise((resolve, reject) => {
        spawn.sync('node',
            [path.resolve(appPath, 'node_modules', 'mk-command', 'scripts', 'copy-remote-dep.js'), '', paths.appPackageDev],
            { stdio: 'inherit' }
        );
        resolve();
    })
}

function createHtmlFile(publicPath, appPath) {
    console.log(`  ${chalk.bold('[6/6]')} 创建html文件...`)
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

