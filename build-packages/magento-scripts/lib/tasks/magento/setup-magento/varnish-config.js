const os = require('os');
const { updateTableValues } = require('../../../util/database');
const getIsWsl = require('../../../util/is-wsl');

/**
 * @returns {import('listr2').ListrTask<import('../../../../typings/context').ListrContext>}
 */
const varnishConfigSetup = () => ({
    title: 'Varnish Database setup',
    task: async (ctx, task) => {
        const {
            config: {
                overridenConfiguration: {
                    configuration: {
                        varnish: {
                            enabled: varnishEnabled
                        }
                    }
                }
            },
            databaseConnection,
            ports,
            debug
        } = ctx;

        const isLinux = os.platform() === 'linux';
        const isWsl = await getIsWsl();
        const isNativeLinux = isLinux && !isWsl;

        if (!debug && varnishEnabled) {
            await updateTableValues('core_config_data', [
                {
                    path: 'system/full_page_cache/varnish/backend_host',
                    value: !isNativeLinux ? 'host.docker.internal' : 'localhost'
                },
                {
                    path: 'system/full_page_cache/varnish/backend_port',
                    value: ports.varnish
                },
                {
                    path: 'system/full_page_cache/varnish/access_list',
                    value: !isNativeLinux ? 'host.docker.internal,localhost' : 'localhost'
                },
                {
                    path: 'system/full_page_cache/caching_application',
                    value: '2'
                }
            ], { databaseConnection, task });
        } else {
            // delete varnish configuration if exists
            await databaseConnection.query(`
                DELETE FROM core_config_data WHERE path LIKE '%varnish%';
            `);

            // update cache policy to not use varnish
            // 0 - magento cache, 2 - varnish cache
            await updateTableValues('core_config_data', [
                {
                    path: 'system/full_page_cache/caching_application',
                    value: '0'
                }
            ], { databaseConnection, task });
        }
    },
    options: {
        bottomBar: 10
    }
});

module.exports = varnishConfigSetup;
