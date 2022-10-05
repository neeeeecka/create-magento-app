const { getProjectConfig } = require('./config');
const { getConfigFromMagentoVersion } = require('./index');

/**
 * @type {() => import('listr2').ListrTask<import('../../typings/context').ListrContext>}
 */
const getProjectConfiguration = () => ({
    title: 'Getting project configuration',
    task: async (ctx) => {
        const { magentoVersion } = ctx;

        if (typeof ctx.debug !== 'boolean') {
            ctx.debug = getProjectConfig().debug;
        }

        ctx.config = await getConfigFromMagentoVersion(ctx, {
            magentoVersion
        });
    }
});

module.exports = getProjectConfiguration;
