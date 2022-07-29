const path = require('path');
const os = require('os');
const envPhpToJson = require('../../util/env-php-json');
const getJsonfileData = require('../../util/get-jsonfile-data');
const pathExists = require('../../util/path-exists');
const { containerApi } = require('../docker/containers');

const composerLockPath = path.join(process.cwd(), 'composer.lock');
const envPhpPath = path.join(process.cwd(), 'app', 'etc', 'env.php');
/**
 * @type {() => import('listr2').ListrTask<import('../../../typings/context').ListrContext>}
 */
const updateEnvPHP = () => ({
    title: 'Updating env.php',
    task: async (ctx, task) => {
        // update env.php only if it's exist
        if (!await pathExists(envPhpPath)) {
            task.skip();
            return;
        }

        const { php } = ctx.config.docker.getContainers(ctx.ports);

        const isLinux = ctx.platform === 'linux';
        const isNativeLinux = isLinux && !ctx.isWsl;
        const hostMachine = isNativeLinux ? '127.0.0.1' : 'host.docker.internal';

        const useVarnish = (!ctx.debug && ctx.config.overridenConfiguration.configuration.varnish.enabled) ? '1' : '';
        const varnishHost = hostMachine;
        const varnishPort = ctx.ports.varnish;
        const previousVarnishPort = ctx.cachedPorts
            ? ctx.cachedPorts.varnish
            : ctx.cachedPorts;

        let SETUP_PQ = '1';

        if (await pathExists(composerLockPath)) {
            const composerLockData = await getJsonfileData(composerLockPath);

            if (composerLockData.packages.some(({ name }) => name === 'scandipwa/persisted-query')) {
                if (typeof ctx.CSAThemeInstalled !== 'boolean') {
                    ctx.CSAThemeInstalled = true;
                }

                const envPhp = await envPhpToJson(ctx);

                const persistedQueryConfig = envPhp.cache && envPhp.cache['persisted-query'];

                if (
                    persistedQueryConfig
                    && persistedQueryConfig.redis
                    && persistedQueryConfig.redis.port === `${ ctx.ports.redis }`
                    && persistedQueryConfig.redis.host === hostMachine
                ) {
                    SETUP_PQ = '';
                    return;
                }
            }
        }

        const result = await containerApi.run({
            env: {
                USE_VARNISH: useVarnish,
                VARNISH_PORT: `${ varnishPort }`,
                VARNISH_HOST: varnishHost,
                PREVIOUS_VARNISH_PORT: `${ previousVarnishPort }`,
                SETUP_PQ,
                REDIS_PORT: ctx.ports.redis,
                ADMIN_URI: ctx.config.overridenConfiguration.magento.adminuri,
                HOST_MACHINE: hostMachine,
                PORTS: JSON.stringify(ctx.ports)
            },
            command: 'php ./update-env-php.php',
            mountVolumes: [
                `${path.join(__dirname, 'update-env.php')}:${ctx.config.baseConfig.containerMagentoDir}/update-env-php.php`,
                `${envPhpPath}:/${ctx.config.baseConfig.containerMagentoDir}/env.php`
            ],
            image: php.image,
            detach: false,
            rm: true,
            user: isLinux ? `${os.userInfo().uid}:${os.userInfo().gid}` : ''
        });

        task.output = result;
    }
});

module.exports = updateEnvPHP;
