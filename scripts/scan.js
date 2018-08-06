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

const packageJson = require(paths.appPackageJson);
var appsDirectory = process.argv[2] ? path.resolve(process.argv[2]) : path.join(paths.appPath, 'apps');
console.log('正在扫描本地依赖app,在' + appsDirectory + '目录...\n')

var appDependencies = {}

scanLocalApps(appsDirectory)
scanRemoteApps()

packageJson.appDependencies = {
  ...packageJson.appDependencies,
  ...appDependencies
}
console.log()
console.log('更新网站本地依赖app,package.json文件')
fs.writeFileSync(
  paths.appPackageJson,
  JSON.stringify(packageJson, null, 2)
);
console.log()

function scanLocalApps(dir) {
  if(!fs.existsSync(dir))
    return
    
  var files = fs.readdirSync(dir, () => { })
  files.forEach(fileName => {
    var stats = fs.statSync(path.join(dir, fileName))
    //是文件
    if (stats.isFile()) {
      if (fileName === 'package.json') {
        let subAppJson = require(path.join(dir, 'package.json'))
        if (subAppJson.isMKApp == true) {
          let subDir = path.relative(paths.appPath, dir)
          console.log(`@发现应用${chalk.cyan(subAppJson.name)},路径:${chalk.cyan(subDir)}`)
          appDependencies[subAppJson.name] = {
            from: 'local',
            path: path.relative(paths.appPath, dir),
            options: {}
          }
        }
      }
    } else if (stats.isDirectory() && fileName != 'node_modules') {
      scanLocalApps(path.join(dir, fileName))
    }
  })
}

function scanRemoteApps() {
  Object.keys(packageJson.dependencies).forEach(k => {
    let json = JSON.parse(fs.readFileSync(path.join(paths.appSrc, 'node_modules', k, 'package.json'), 'utf-8'))
    if (json.isMKApp) {
      appDependencies[json.name] = {
        from: 'MK',
        options: {}
      }
    }
  })
}