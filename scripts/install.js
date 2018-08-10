'use strict';

const chalk = require('chalk');
const commander = require('commander');
const fs = require('fs-extra');
const path = require('path');
const paths = require('../config/paths')
const consts = require('../config/consts')
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

checkIfOnline()
    .then(isOnline => installByYarn(paths.appSrc, isOnline))
    .then((r) =>  r && scan())


function installByYarn(root, isOnline) {
    return new Promise((resolve, reject) => {
        let command;
        let args;

        command = 'yarnpkg';
        args = ['install','--registry', consts.mkServerUrl, '--exact'];
        if (!isOnline) {
            args.push('--offline');
        }
        args.push('--cwd');
        args.push(root);

        if (!isOnline) {
            console.log(chalk.yellow('请联网.'));
            console.log();
            resolve(false);
        }
        spawn.sync(command, args, { stdio: 'inherit' });
        resolve(true);
    });
}

function scan() {
    const spawn = require('react-dev-utils/crossSpawn');
    spawn.sync('node',[require.resolve('./scan.js')],{ stdio: 'inherit' });
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
