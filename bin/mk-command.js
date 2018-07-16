'use strict';

const spawn = require('react-dev-utils/crossSpawn');
const args = process.argv.slice(2);

const scriptIndex = args.findIndex(
    x => x === 'build' || x === 'start'
);
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];
const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : [];

switch (script) {
    case 'build':
    case 'start': {
        const result = spawn.sync(
            'node',
            nodeArgs
                .concat(require.resolve('../scripts/' + script))
                .concat(args.slice(scriptIndex + 1)),
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
        break;
    }
    default:
        console.log('未知脚本 "' + script + '".');
        break;
}
