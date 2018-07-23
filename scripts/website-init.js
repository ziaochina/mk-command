'use strict';

process.on('unhandledRejection', err => {
    throw err;
});

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const spawn = require('react-dev-utils/crossSpawn');

module.exports = function (
    websitePath,
    websiteName,
    originalDirectory
) {
    const ownPackageName = require(path.join(__dirname, '..', 'package.json')).name;
    const ownPath = path.join(websitePath, 'node_modules', ownPackageName);
    const websitePackage = require(path.join(websitePath, 'package.json'));
    const useYarn = true;

    websitePackage.dependencies = websitePackage.dependencies || {};

    websitePackage.scripts = {
        'start': 'mk website-start',
        'pkg': 'mk website-pkg'
    };

    fs.writeFileSync(
        path.join(websitePath, 'package.json'),
        JSON.stringify(websitePackage, null, 2)
    );

    const templatePath = path.join(ownPath, 'template', 'website');
    if (fs.existsSync(templatePath)) {
        fs.copySync(templatePath, websitePath);
    } else {
        console.error(
            `找不到应用模板: ${chalk.green(templatePath)}`
        );
        return;
    }

    fs.move(
        path.join(websitePath, 'apps', 'welcome', 'gitignore'),
        path.join(websitePath, 'apps', 'welcome', '.gitignore'),
        [],
        err => {
            if (err) {
                //已经存在替换内容
                if (err.code === 'EEXIST') {
                    const data = fs.readFileSync(path.join(websitePath, 'apps', 'welcome', 'gitignore'));
                    fs.appendFileSync(path.join(websitePath, 'apps', 'welcome', '.gitignore'), data);
                    fs.unlinkSync(path.join(websitePath, 'apps', 'welcome', 'gitignore'));
                } else {
                    throw err;
                }
            }
        }
    );

    fs.move(
        path.join(websitePath, 'apps', 'welcome', 'npmignore'),
        path.join(websitePath, 'apps', 'welcome', '.npmignore'),
        [],
        err => {
            if (err) {
                //已经存在替换内容
                if (err.code === 'EEXIST') {
                    const data = fs.readFileSync(path.join(websitePath, 'apps', 'welcome', 'npmignore'));
                    fs.appendFileSync(path.join(websitePath, 'apps', 'welcome', '.npmignore'), data);
                    fs.unlinkSync(path.join(websitePath, 'apps', 'welcome', 'npmignore'));
                } else {
                    throw err;
                }
            }
        }
    );

    let cdpath;
    if (originalDirectory && path.join(originalDirectory, websiteName) === websitePath) {
        cdpath = websiteName;
    } else {
        cdpath = websitePath;
    }

    const displayedCommand = useYarn ? 'yarn' : 'npm';

    console.log();
    console.log(`创建应用 ${websiteName} 成功，目录：${websitePath}`);
    console.log('你可以在该目录下运行下面命令:');
    console.log();
    console.log(chalk.cyan(`  ${displayedCommand} start`));
    console.log('    启动开发服务器.');
    console.log();
    console.log(
        chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}pkg`)
    );
    console.log('    打包网站.');
    console.log();
    console.log('建议从下面的命令开始:');
    console.log();
    console.log(chalk.cyan('  cd'), cdpath);
    console.log(`  ${chalk.cyan(`${displayedCommand} start`)}`);
    console.log();
    console.log('感谢您使用mk!');
};
