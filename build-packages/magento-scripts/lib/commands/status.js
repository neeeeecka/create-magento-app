const logger = require('@scandipwa/common-dev-utils/logger');
const { Listr } = require('listr2');
const getMagentoVersionConfig = require('../config/get-magento-version-config');
const { getCachedPorts } = require('../config/get-port-config');

const { prettyStatus } = require('../tasks/status');
const { checkRequirements } = require('../tasks/requirements');
const { statusContainers } = require('../tasks/docker/containers');
const getConfigFromConfigFile = require('../config/get-config-from-config-file');

module.exports = (yargs) => {
    yargs.command('status', 'Show application status', () => {}, async (args) => {
        const tasks = new Listr([
            checkRequirements,
            getMagentoVersionConfig,
            getConfigFromConfigFile,
            getCachedPorts,
            statusContainers
        ], {
            concurrent: false,
            exitOnError: true,
            ctx: { throwMagentoVersionMissing: true, ...args },
            rendererOptions: { collapse: false, clearOutput: true }
        });

        try {
            prettyStatus(await tasks.run());
        } catch (e) {
            logger.error(e.message || e);
            process.exit(1);
        }
        process.exit(0);
    });
};
