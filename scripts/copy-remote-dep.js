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

const isRelease = process.argv[2] === 'release'
const targetPath =  process.argv[3] || paths.appPublic
const mkJson = require(path.join(paths.appSrc, 'mk.json'));

Object.keys(mkJson.dependencies).forEach(k => {
    if (mkJson.dependencies[k].from == 'MK') {
        let buildPath = path.resolve(paths.appSrc, 'node_modules', k, 'build', isRelease ? 'prod' : 'dev')
        console.log(buildPath)
        if (fs.existsSync(buildPath)) {
            fs.copySync(buildPath, targetPath);
        }
    }
})

