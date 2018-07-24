'use strict';

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

//promise未处理reject的异常
process.on('unhandledRejection', err => {
  throw err;
});

require('../config/env');

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const paths = require('../config/paths');

const appJson = require(paths.appPackageJson);
const mkJsonPath = path.join(paths.appPath, 'mk.json')
const mkJson = require(mkJsonPath);

var appsDirectory = process.argv[2] ? path.resolve(process.argv[2]) : path.join(paths.appPath, 'apps');
console.log('正在扫描本地依赖app,在' + appsDirectory + '目录...\n')

var localApps = {}

findApps(appsDirectory)

mkJson.dependencies = {
  ...mkJson.dependencies,
  ...localApps
}
console.log()
console.log('更新网站本地依赖app,mk.json文件')
fs.writeFileSync(
  mkJsonPath,
  JSON.stringify(mkJson, null, 2)
);
console.log()

function findApps(dir) {
  var files = fs.readdirSync(dir, () => { })
  files.forEach(fileName => {

    var stats = fs.statSync(path.join(dir, fileName))
    //是文件
    if (stats.isFile()) {
      if (fileName === 'mk.json') {
        let subAppJson = require(path.join(dir, 'package.json')),
          subDir = path.relative(paths.appPath, dir),
          buildDir = path.relative(paths.appPath, path.join(dir, 'build', 'dev'))

        console.log(`@发现应用${chalk.cyan(subAppJson.name)},路径:${chalk.cyan(subDir)}`)
        localApps[subAppJson.name] = `file:${path.relative(paths.appPath, dir)}`
      }
    } else if (stats.isDirectory() && fileName != 'node_modules') {
      findApps(path.join(dir, fileName))
    }
  })

}

