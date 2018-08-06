'use strict';

const validateProjectName = require('validate-npm-package-name');
const chalk = require('chalk');
const commander = require('commander');
const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;
const spawn = require('cross-spawn');
const semver = require('semver');
const dns = require('dns');
const tmp = require('tmp');
const unpack = require('tar-pack').unpack;
const url = require('url');
const hyperquest = require('hyperquest');
const envinfo = require('envinfo');

const packageJson = require('../package.json');
let projectName = process.argv[2];

if (typeof projectName === 'undefined') {
  console.error('请输入websiteName:');
  console.log();
  console.log('示例:');
  console.log(`  mk website ${chalk.green('hello-world')}`);
  console.log();
  process.exit(1);
}

createWebsite(projectName);

function createWebsite(name) {
  const root = path.resolve(name);
  const websiteName = path.basename(root);

  createDir(root, name)
    .then(() => createPackageJson(root, websiteName))
    .then(() => install())
    .then(() => init(name, root))
    .catch(reason => exceptionHandler(reason, root))
}

function createDir(root, name) {
  return new Promise((resolve, reject) => {
    fs.ensureDirSync(name);
    //更换工作目录
    process.chdir(root);
    console.log(`开始创建网站，目录： ${chalk.green(root)}.`);
    console.log();
    resolve();
  })
}

function createPackageJson(root, websiteName) {
  return new Promise((resolve, reject) => {
    const packageJson = {
      isMKWebsite: true,
      name: websiteName,
      description: websiteName,
      version: '1.0.0',
      license: 'MIT',
      author: '',
      keywords: ['mk', 'monkey king', 'react', 'redux', 'antd'],
      repository: {
        "type": "git",
        "url": "git+https://github.com/ziaochina/mk-command.git"
      },
      server: {
        "proxy": null,
        "port": 8000
      },
      dependencies: {
        "mk-command": '*',
        "mk-sdk": '*'
      },
      appDependencies: {}
    };

    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    resolve()
  })
}

function install() {
  return new Promise((resolve, reject) => {
    const spawn = require('react-dev-utils/crossSpawn');
    spawn.sync('node', [require.resolve('./install.js')], { stdio: 'inherit' });
    resolve();
  })
}
function init(name, root) {
  return new Promise((resolve, reject) => {
    const initScriptPath = path.resolve(
      process.cwd(),
      'node_modules',
      'mk-command',
      'scripts',
      'website-init.js'
    );
    const originalDirectory = process.cwd();
    const init = require(initScriptPath);
    init(root, name, originalDirectory)
    resolve()
  })
}

function exceptionHandler(reason, root) {
  console.log();
  console.log('安装退出.');
  if (reason.command) {
    console.log(`  ${chalk.cyan(reason.command)} 失败.`);
  } else {
    console.log(chalk.red('未知异常，请提交错误报告:'));
    console.log(reason);
  }
  console.log();

  const knownGeneratedFiles = [
    'package.json',
    'npm-debug.log',
    'yarn-error.log',
    'yarn-debug.log',
    'node_modules',
  ];
  const currentFiles = fs.readdirSync(path.join(root));
  currentFiles.forEach(file => {
    knownGeneratedFiles.forEach(fileToMatch => {
      if (
        (fileToMatch.match(/.log/g) && file.indexOf(fileToMatch) === 0) ||
        file === fileToMatch
      ) {
        console.log(`删除生成的文件... ${chalk.cyan(file)}`);
        fs.removeSync(path.join(root, file));
      }
    });
  });
  const remainingFiles = fs.readdirSync(path.join(root));
  if (!remainingFiles.length) {
    console.log(
      `删除应用 ${chalk.cyan(`${appName} /`)}, 目录: ${chalk.cyan(
        path.resolve(root, '..')
      )}`
    );
    process.chdir(path.resolve(root, '..'));
    fs.removeSync(path.join(root));
  }
  console.log('Done.');
  process.exit(1);
}