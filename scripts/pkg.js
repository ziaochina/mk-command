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
const config = require('../config/webpack.config.pkg');
const paths = require('../config/paths');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const printBuildError = require('react-dev-utils/printBuildError');
const template = require('art-template');
const spawn = require('cross-spawn');

const appDirectory = fs.realpathSync(process.cwd());

// 检测必须的文件，不存在自动退出
if (!checkRequiredFiles([paths.appIndexJs])) {
    process.exit(1);
}
console.log(chalk.green(`开始打包生产环境网站...`));
emptyDir()
    .then(() => build())
    .then(() => copyCoreLib())
    .then(() => scanAppDep(paths.appPath))
    .then(() => copyLocalDep(paths.appPath))
    .then(() => copyRemoteDep(paths.appPath))
    .then(() => createHtmlFile(paths.appPackage, paths.appPath))
    .then(() => {
        console.log(chalk.green(`打包成功,输出目录:${paths.appPackage}\n`));
        return Promise.resolve()
    })
    .catch(err => {
        console.log(chalk.red('打包失败.\n'));
        //输出编译异常
        printBuildError(err);
        process.exit(1);
    })
  
function emptyDir() {
    console.log(`  ${chalk.bold('[1/7]')} 清空目录:${paths.appPackage}`)
    return new Promise((resolve, reject) => {
        //清空目录中文件
        fs.emptyDirSync(paths.appPackage);
        resolve()
    })
}


function build() {
    console.log(`  ${chalk.bold('[2/7]')} 编译app...`)
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
                warnings: messages.warnings,
            });
        });
    });
}

function copyCoreLib() {
    console.log(`  ${chalk.bold('[3/7]')} 复制sdk...`)
    return new Promise((resolve, reject)=>{
        let libPath = path.resolve(appDirectory, 'node_modules', 'mk-sdk', 'dist', 'release')
        if (!fs.existsSync(paths.appPackage)) {
            fs.mkdirSync(paths.appPackage);
        }
        fs.copySync(libPath, paths.appPackage);
        resolve()
    })
    
}

function scanAppDep(appPath) {
    console.log(`  ${chalk.bold('[4/7]')} 扫描依赖app...`)
    return new Promise((resolve, reject) => {
        spawn.sync('node',
            [path.resolve(appPath, 'node_modules', 'mk-command', 'scripts', 'scan.js') ],
            { stdio: 'inherit' }
        );
        resolve()
    })
}

function copyLocalDep(appPath) {
    console.log(`  ${chalk.bold('[5/7]')} 复制本地依赖app...`)
    return new Promise((resolve, reject) => {
        spawn.sync('node',
            [path.resolve(appPath, 'node_modules', 'mk-command', 'scripts', 'copy-local-dep.js'), 'release', paths.appPackage],
            { stdio: 'inherit' }
        );
        resolve();
    })
}

function copyRemoteDep(appPath) {
    console.log(`  ${chalk.bold('[6/7]')} 复制远程依赖app...`)
    return new Promise((resolve, reject) => {
        spawn.sync('node',
            [path.resolve(appPath, 'node_modules', 'mk-command', 'scripts', 'copy-remote-dep.js'), 'release', paths.appPackage],
            { stdio: 'inherit' }
        );
        resolve();
    })
}

function createHtmlFile(publicPath, appPath) {
    console.log(`  ${chalk.bold('[7/7]')} 创建html文件...`)
    return new Promise((resolve, reject) => {
        const htmlTplPath = path.resolve(appPath, 'index.html');
        let html = fs.readFileSync(htmlTplPath, 'utf-8');
        let render = template.compile(html);
        let packageJson = JSON.parse(fs.readFileSync(path.join(appPath, 'package.json'), 'utf-8'))
        let mkJson = JSON.parse(fs.readFileSync(path.join(appPath, 'mk.json'), 'utf-8'))
        html = render({ ...packageJson, ...mkJson});
        fs.writeFileSync(path.resolve(publicPath, 'index.html'), html);
        resolve();
    })
}

