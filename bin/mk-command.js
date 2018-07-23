#!/usr/bin/env node
'use strict';

var chalk = require('chalk');

var currentNodeVersion = process.versions.node;
var semver = currentNodeVersion.split('.');
var major = semver[0];

if (major < 4) {
    console.error(
        chalk.red(
            '您当前的node版本是 ' +
            currentNodeVersion +
            '.\n' +
            'mk依赖>=4的版本. \n' +
            '请升级您的node版本.'
        )
    );
    process.exit(1);
}

var which = require('which'),
    flag = false

try{
    const resolved = which.sync('yarn')
    if( resolved ){
        flag = true
    }
}catch(err){
    console.log(err)
}
if( !flag ){
    console.log(chalk.yellowBright('mk依赖yarn，您没有安装 \n'))
    console.log(chalk.greenBright('请先安装yarn \n'))
    console.log(chalk.cyan('npm i -g yarn'))
    process.exit(1);
}

const packageJson = require('../package.json');
const program = require('commander');

program
    .version(packageJson.version)

program
    .command('app <appName>')
    .action(function (...args) {
        run('app', args)
    })

program
    .command('website <website>')
    .action(function (...args) {
        run('website', args)
    })

program
    .command('build')
    .action(function (...args) {
        run('build', args)
    })

program
    .command('build-dev')
    .action(function (...args) {
        run('build-dev', args)
    })

program
    .command('pkg')
    .action(function (...args) {
        run('pkg', args)
    })

program
    .command('pkg-dev')
    .action(function (...args) {
        run('pkg-dev', args)
    })

program
    .command('scan')
    .action(function (...args) {
        run('scan', args)
    })
program
    .command('copy-local-dep')
    .action(function (...args) {
        run('copy-local-dep', args)
    })
program
    .command('start')
    .action(function (...args) {
        run('start', args)
    })

program
    .command('website-start')
    .action(function (...args) {
        run('website-start', args)
    })

program
    .command('website-pkg')
    .action(function (...args) {
        run('website-pkg', args)
    })

program
    .command('*')
    .action(function (env) {
        console.log('没有这个命令 "%s"', env)
    })

program.parse(process.argv)

function run(script, args) {
    if(typeof args[0] !== 'string')
        args = []
    args.splice(0, 0, require.resolve('../scripts/' + script))

    const spawn = require('react-dev-utils/crossSpawn');
    const result = spawn.sync(
        'node',
        args,
        { stdio: 'inherit' }
    );
    if (result.signal) {
        if (result.signal === 'SIGKILL') {
            console.log("构建失败，内存溢出或者进程太早退出导致，使用 kill -9 删除进程");
        } else if (result.signal === 'SIGTERM') {
            console.log('构建失败，进程太早退出，可能有人调用kill 或者killall或者系统关闭. ');
        }
        process.exit(1);
    }
    process.exit(result.status);
}