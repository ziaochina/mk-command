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
console.log(mkJson)
var appsDirectory = process.argv[2] ? path.resolve(process.argv[2]) : path.join(paths.appPath, 'apps');

console.log('正在拷贝本地依赖app编译结果,在' + appsDirectory + '目录...\n')

Object.keys(mkJson.dependencies).forEach(k=>{
    if(mkJson.dependencies[k].indexOf('file:') != -1){
        let buildPath = path.resolve(path.join(mkJson.dependencies[k].replace('file:',''),'build', 'dev'))
        console.log(buildPath)
        if(fs.existsSync(buildPath)){
            fs.copySync(buildPath, paths.appPublic);
        }
    }
})

console.log()
console.log('拷贝完成')

