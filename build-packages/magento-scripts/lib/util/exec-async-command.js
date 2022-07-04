const os = require('os');
const logger = require('@scandipwa/scandipwa-dev-utils/logger');
const { spawn } = require('child_process');
const { getArchSync } = require('./arch');
const compileOptions = require('../tasks/php/compile-options');

const execAsyncSpawn = (command, {
    callback = () => {},
    pipeInput,
    logOutput = false,
    cwd,
    withCode = false,
    useRosetta2 = false,
    env = process.env
} = {}) => {
    /**
     * @type {import('child_process').SpawnOptionsWithoutStdio}
     */
    const spawnOptions = {
        stdio: pipeInput ? ['inherit', 'pipe', 'pipe'] : 'pipe',
        cwd,
        env
    };

    /**
     * @type {import('child_process').ChildProcessWithoutNullStreams}
     */
    let childProcess;
    if (useRosetta2 && os.platform() === 'darwin' && getArchSync() === 'arm64') {
        childProcess = spawn(
            'arch',
            // eslint-disable-next-line max-len
            ['-x86_64', 'bash', '-c', command],
            {
                ...spawnOptions,
                env: {
                    ...process.env,
                    PATH: compileOptions.darwin.env.PATH
                }
            }
        );
    } else {
        childProcess = spawn(
            'bash',
            ['-c', command],
            spawnOptions
        );
    }

    return new Promise((resolve, reject) => {
        const chunks = [];

        /**
         * @param {Buffer} chunk
         */
        const addChunk = (chunk) => {
            chunks.push(Buffer.from(chunk));
            const newData = chunk.toString('utf-8');
            newData.split('\n').map((str) => str.trim()).forEach((str) => {
                callback(str);
            });
            if (logOutput) {
                newData.split('\n').filter(Boolean).forEach((line) => {
                    logger.log(line);
                });
            }
        };

        childProcess.stdout.on('data', addChunk);
        childProcess.stderr.on('data', addChunk);

        childProcess.on('error', (error) => {
            reject(error);
        });
        childProcess.on('close', (code) => {
            const result = Buffer.concat(chunks).toString('utf8').trim();
            if (withCode) {
                resolve({ code, result });
                return;
            }
            if (code > 0) {
                reject(result);
            } else {
                resolve(result);
            }
        });
    });
};

const execCommandTask = (command, options = {}) => ({
    title: `Running command "${command}"`,
    task: (ctx, task) => execAsyncSpawn(command, {
        callback: !ctx.verbose ? undefined : (t) => {
            task.output = t;
        },
        ...options
    }),
    option: {
        bottomBar: 10
    }
});

module.exports = {
    execAsyncSpawn,
    execCommandTask
};
