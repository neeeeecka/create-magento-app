const { execAsyncSpawn } = require('../../util/exec-async-command');

/**
 * @type {import('listr2').ListrTask<import('../../../typings/context').ListrContext>}
 */
const createNetwork = {
    title: 'Deploying docker network',
    task: async ({ config: { docker } }, task) => {
        const networkList = await execAsyncSpawn('docker network ls');

        if (networkList.includes(docker.network.name)) {
            task.skip();
            return;
        }

        await execAsyncSpawn(`docker network create --driver=bridge ${ docker.network.name }`);
    }
};

/**
 * @type {import('listr2').ListrTask<import('../../../typings/context').ListrContext>}
 */
const removeNetwork = {
    title: 'Remove docker network',
    task: async ({ config: { docker } }, task) => {
        const networkList = await execAsyncSpawn('docker network ls');

        if (!networkList.includes(docker.network.name)) {
            task.skip();
            return;
        }

        await execAsyncSpawn(`docker network rm ${ docker.network.name }`);
    }
};

module.exports = {
    createNetwork,
    removeNetwork
};
