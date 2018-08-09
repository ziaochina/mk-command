'use strict';

const chalk = require('chalk');
const execSync = require('child_process').execSync;
const spawn = require('cross-spawn');
const dns = require('dns');
const url = require('url');
const consts = require('../config/consts')


checkIfOnline()
    .then(isOnline => adduser(isOnline))


function adduser(isOnline) {
    return new Promise((resolve, reject) => {
        let command;
        let args;

        command = 'npm';
        args = ['adduser', '--registry', consts.mkServerUrl];
        if (!isOnline) {
            args.push('--offline');
        }
        args.push('--cwd');

        if (!isOnline) {
            console.log(chalk.yellow('请联网.'));
            console.log();
            resolve(false);
        }
        spawn.sync(command, args, { stdio: 'inherit' });
        resolve(true);
    });
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
