/* eslint-disable max-len */
const sleep = require('../../../util/sleep');
const logger = require('@scandipwa/scandipwa-dev-utils/logger');
const KnownError = require('../../../errors/known-error');
const containerApi = require('./container-api');
const { imageApi } = require('../image');
const { execAsyncSpawn } = require('../../../util/exec-async-command');

const stop = async (containers) => {
    await execAsyncSpawn(`docker container stop ${containers.join(' ')}`);
    await execAsyncSpawn(`docker container rm ${containers.join(' ')}`);
};

const pull = async (image) => execAsyncSpawn(`docker pull ${image}`);

const remoteImageFilter = (container) => {
    if (typeof container.remoteImage === 'boolean') {
        return container.remoteImage;
    }

    return true;
};

/**
 * @type {() => import('listr2').ListrTask<import('../../../../typings/context').ListrContext>}
 */
const pullImages = () => ({
    title: 'Pulling container images',
    task: async ({ config: { docker } }, task) => {
        const containers = Object.values(docker.getContainers());
        const imagesFilter = containers
            .filter(remoteImageFilter)
            .map((container) => `reference='${container.image}'`);
        const existingImages = await imageApi.ls({
            formatToJSON: true,
            filter: imagesFilter
        });

        const missingContainerImages = containers
            .filter(remoteImageFilter)
            .map((container) => {
                const [image, tag = 'latest'] = container.image.split(':');

                return {
                    ...container,
                    imageDetails: {
                        image, tag
                    }
                };
            })
            .filter((container) => !existingImages.some((image) => image.Repository === container.imageDetails.image && image.Tag === container.imageDetails.tag))
            .reduce((acc, val) => acc.concat(acc.some((c) => c.imageDetails.name === val.imageDetails.name && c.imageDetails.tag === val.imageDetails.tag) ? [] : val), []);

        if (missingContainerImages.length === 0) {
            task.skip();
            return;
        }

        return task.newListr(
            missingContainerImages.map((container) => ({
                title: `Pulling ${ logger.style.file(`${container.image}`) } image`,
                task: () => pull(`${container.image}`)
            })), {
                concurrent: true,
                exitOnError: true
            }
        );
    }
});

/**
 * @type {() => import('listr2').ListrTask<import('../../../typings/context').ListrContext>}
 */
const startContainers = () => ({
    title: 'Starting containers',
    task: async ({ ports, config: { docker }, debug }, task) => {
        const containerList = (await execAsyncSpawn('docker container ls --all --format="{{.Names}}"')).split('\n');

        const missingContainers = Object.values(docker.getContainers(ports)).filter(
            ({ name }) => !containerList.includes(name)
        );

        if (missingContainers.length === 0) {
            task.skip();
            return;
        }

        if (debug) {
            await Promise.all(
                missingContainers
                    .map((container) => {
                        if (container.debugImage) {
                            container.image = container.debugImage;
                        }

                        return container;
                    }).map((container) => containerApi.run(container).then((out) => {
                        task.output = `From ${container._}: ${out}`;
                    }))
            );

            return;
        }

        // TODO: we might stop containers here ?
        await Promise.all(missingContainers.map((container) => containerApi.run(container).then((out) => {
            task.output = `From ${container._}: ${out}`;
        })));
    },
    options: {
        bottomBar: 10
    }
});

/**
 * @type {() => import('listr2').ListrTask<import('../../../typings/context').ListrContext>}
 */
const stopContainers = () => ({
    title: 'Stopping Docker containers',
    task: async ({ config: { baseConfig: { prefix } } }, task) => {
        const containerList = (await execAsyncSpawn('docker container ls --all --format="{{.Names}}"')).split('\n');

        const runningContainers = containerList.filter((containerName) => containerName.startsWith(prefix));

        if (runningContainers.length === 0) {
            task.skip();
            return;
        }

        await stop(runningContainers);
    }
});

const getContainerStatus = async (containerName) => {
    try {
        return JSON.parse(await execAsyncSpawn(`docker inspect --format='{{json .State}}' ${containerName}`));
    } catch {
        return null;
    }
};

/**
 * @type {() => import('listr2').ListrTask<import('../../../typings/context').ListrContext>}
 */
const checkContainersAreRunning = () => ({
    title: 'Checking container statuses',
    task: async (ctx, task) => {
        const { config: { docker }, ports } = ctx;
        const containers = Object.values(docker.getContainers(ports));
        let tries = 0;
        while (tries < 3) {
            const containersWithStatus = await Promise.all(
                containers.map(async (container) => ({
                    ...container,
                    status: await getContainerStatus(container.name)
                }))
            );

            if (containersWithStatus.some((c) => c.status.Status !== 'running')) {
                if (tries === 2) {
                    throw new KnownError(`${containersWithStatus.filter((c) => c.status.Status !== 'running').map((c) => c._).join(', ')} containers are not running! Please check container logs for more details!`);
                } else {
                    task.output = `${containersWithStatus.filter((c) => c.status.Status !== 'running').map((c) => c._).join(', ')} are not running, waiting if something will change...`;
                    await sleep(2000);
                    tries++;
                }
            } else {
                break;
            }
        }
    },
    options: {
        bottomBar: 10
    }
});

/**
 * @type {() => import('listr2').ListrTask<import('../../../typings/context').ListrContext>}
 */
const statusContainers = () => ({
    task: async (ctx) => {
        const { config: { docker }, ports } = ctx;
        const containers = Object.values(docker.getContainers(ports));

        ctx.containers = await Promise.all(
            containers.map(async (container) => ({
                ...container,
                status: await getContainerStatus(container.name)
            }))
        );
    },
    options: {
        bottomBar: 10
    }
});

module.exports = {
    startContainers,
    stopContainers,
    pullImages,
    statusContainers,
    checkContainersAreRunning,
    getContainerStatus
};
