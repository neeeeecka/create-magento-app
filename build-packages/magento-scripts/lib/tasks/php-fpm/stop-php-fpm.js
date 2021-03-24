const fs = require('fs');
const { execAsyncSpawn } = require('../../util/exec-async-command');
const pathExists = require('../../util/path-exists');

const getProcessId = async (fpmPidFilePath) => {
    const pidExists = await pathExists(fpmPidFilePath);

    if (pidExists) {
        return fs.promises.readFile(fpmPidFilePath, 'utf-8');
    }

    return null;
};

/**
 * @type {import('listr2').ListrTask<import('../../../typings/context').ListrContext>}
 */
const stopPhpFpmTask = {
    title: 'Stopping php-fpm',
    task: async ({ config: { php } }, task) => {
        try {
            const processId = await getProcessId(php.fpmPidFilePath);
            if (!processId) {
                task.skip();
                return;
            }
            await execAsyncSpawn(`kill ${processId}`);

            if (await pathExists(php.fpmPidFilePath)) {
                try {
                    await fs.promises.unlink(php.fpmPidFilePath);
                } catch (e) {
                    //
                }
            }
        } catch (e) {
            if (e.toLowerCase().includes('no such process')) {
                try {
                    await fs.promises.unlink(php.fpmPidFilePath);
                } catch (e) {
                    //
                }

                return;
            }

            throw new Error(
                `Unexpected error while stopping php-fpm.
                See ERROR log below.\n\n${e}`
            );
        }
    },
    options: {
        bottomBar: 10
    }
};

module.exports = stopPhpFpmTask;
