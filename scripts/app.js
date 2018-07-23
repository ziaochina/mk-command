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
  console.error('请输入appName:');
  console.log();
  console.log('示例:');
  console.log(`  mk app ${chalk.green('hello-world')}`);
  console.log();
  process.exit(1);
}

createApp(projectName);

function createApp(name) {
  const root = path.resolve(name);
  const appName = path.basename(root);

  fs.ensureDirSync(name);

  console.log(`开始创建应用，目录： ${chalk.green(root)}.`);
  console.log();

  const packageJson = {
    name: appName,
    version: '1.0.0',
    license: 'MIT',
    author: '',
    keywords: ['mk', 'monkey king', 'react', 'redux', 'antd'],
    repository: {
      "type": "git",
      "url": "git+https://github.com/ziaochina/mk-command.git"
    }
  };

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  const useYarn = true;
  const originalDirectory = process.cwd();
  //更换工作目录
  process.chdir(root);

  run(root, appName, originalDirectory);
}

function install(root, dependencies, isOnline) {
  return new Promise((resolve, reject) => {
    let command;
    let args;

    command = 'yarnpkg';
    args = ['add', '--exact'];
    if (!isOnline) {
      args.push('--offline');
    }
    [].push.apply(args, dependencies);

    args.push('--cwd');
    args.push(root);

    if (!isOnline) {
      console.log(chalk.yellow('请联网.'));
      console.log();
    }

    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`,
        });
        return;
      }
      resolve();
    });
  });
}

function run(
  root,
  appName,
  originalDirectory
) {
  const packageToInstall = 'mk-command@*';
  const allDependencies = ['mk-sdk@*', packageToInstall];

  console.log('正在安装依赖，可能需要几分钟...');
  getPackageName(packageToInstall)
    .then(packageName =>
      checkIfOnline().then(isOnline => ({
        isOnline: isOnline,
        packageName: packageName,
      }))
    )
    .then(info => {
      const isOnline = info.isOnline;
      const packageName = info.packageName;
      return install(root, allDependencies, isOnline).then(
        () => packageName
      );
    })
    .then(packageName => {
      setCaretRangeForRuntimeDeps(packageName);

      const initScriptPath = path.resolve(
        process.cwd(),
        'node_modules',
        packageName,
        'scripts',
        'init.js'
      );
      const init = require(initScriptPath);
      init(root, appName, originalDirectory);

    })
    .catch(reason => {
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
    });
}


function getPackageName(installPackage) {
  if (installPackage.match(/.+@/)) {
    return Promise.resolve(
      installPackage.charAt(0) + installPackage.substr(1).split('@')[0]
    );
  }
  else {
    return Promise.resolve(installPackage);
  }
}

function setCaretRangeForRuntimeDeps(packageName) {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = require(packagePath);

  if (typeof packageJson.dependencies === 'undefined') {
    console.error(chalk.red('package.json中检测不到依赖'));
    process.exit(1);
  }

  const packageVersion = packageJson.dependencies[packageName];
  if (typeof packageVersion === 'undefined') {
    console.error(chalk.red(`package.json中检测不到依赖包 ${packageName} `));
    process.exit(1);
  }

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
}

function getProxy() {
  if (process.env.https_proxy) {
    return process.env.https_proxy;
  } else {
    try {
      let httpsProxy = execSync('npm config get https-proxy')
        .toString()
        .trim();
      return httpsProxy !== 'null' ? httpsProxy : undefined;
    } catch (e) {
      return;
    }
  }
}

function checkIfOnline(useYarn) {
  return new Promise(resolve => {
    dns.lookup('registry.yarnpkg.com', err => {
      let proxy;
      if (err != null && (proxy = getProxy())) {
        dns.lookup(url.parse(proxy).hostname, proxyErr => {
          resolve(proxyErr == null);
        });
      } else {
        resolve(err == null);
      }
    });
  });
}
