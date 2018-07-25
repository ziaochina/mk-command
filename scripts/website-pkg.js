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
const paths = require('../config/paths');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const template = require('art-template');

const useYarn = true;// fs.existsSync(paths.yarnLockFile);
const isInteractive = process.stdout.isTTY;

const measureFileSizesBeforeBuild =
    FileSizeReporter.measureFileSizesBeforeBuild;

const appDirectory = fs.realpathSync(process.cwd());

const appJson = require(paths.appPackageJson);


measureFileSizesBeforeBuild(paths.appPackage)
    .then(previousFileSizes => {
        console.log(chalk.green('正在打包生产环境网站...\n'))

        console.log(`清空目录${paths.appPackage}`)

        //清空目录中文件
        fs.emptyDirSync(paths.appPackage);

        let libPath = path.resolve(appDirectory, 'node_modules', 'mk-sdk', 'dist', 'release')

        if (!fs.existsSync(paths.appPackage)) {
            console.log(paths.appPackage)
            fs.mkdirSync(paths.appPackage);
        }

        console.log(`copy mk sdk文件`)
        fs.copySync(libPath, paths.appPackage);

        const spawn = require('react-dev-utils/crossSpawn');
        spawn.sync('node', [require.resolve('./scan.js')], { stdio: 'inherit' });


        let ownHtmlPath = path.resolve(appDirectory, 'node_modules', 'mk-sdk', 'template', 'app', 'index-dev.html')
        let appHtmlPath = path.resolve(appDirectory, 'index.html')
        let html = fs.existsSync(appHtmlPath) ? fs.readFileSync(appHtmlPath, 'utf-8') : fs.readFileSync(ownHtmlPath, 'utf-8');
        let render = template.compile(html);
        console.log(`正在拷贝依赖app编译结果`)
        let mkJson = JSON.parse(fs.readFileSync(path.join(appDirectory, 'mk.json'), 'utf-8') )
        let apps = Object.keys(mkJson.dependencies).reduce((a, b) => {
            //copy依赖app资源
            if (mkJson.dependencies[b].indexOf('file:') != -1) {
                let depPath = path.resolve(appDirectory, mkJson.dependencies[b].replace('file:', ''), 'build', 'prod')
                if (fs.existsSync(depPath)) {
                    console.log(`拷贝${depPath}`)
                    fs.copySync(depPath, paths.appPackage);
                } else {
                    console.log
                    console.log(chalk.red(`    依赖app编译结果${depPath}不存在`))
                    console.log(chalk.red(`    请在${path.resolve(appDirectory, mkJson.dependencies[b].replace('file:', ''))},执行命令yarn build`))
                }
            }
            a[b] = { asset: `${b}.min.js` }
            return a
        }, {})
        html = render(mkJson);
        fs.writeFileSync(path.resolve(paths.appPackage, 'index.html'), html);
        console.log()
        console.log(chalk.green(`打包完成，目录:${paths.appPackage}\n`))

    })
