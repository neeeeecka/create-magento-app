/* eslint-disable no-param-reassign */
const fs = require('fs');
const pathExists = require('../../util/path-exists');

/**
 * @type {import('listr2').ListrTask<import('../../../typings/context').ListrContext>}
 */
const createCacheFolder = {
    title: 'Creating cache folder',
    task: async ({ config: { baseConfig } }, task) => {
        const cacheFolderExists = await pathExists(baseConfig.cacheDir);

        if (cacheFolderExists) {
            task.skip();
            return;
        }

        await fs.promises.mkdir(baseConfig.cacheDir);
    }
};

module.exports = createCacheFolder;
