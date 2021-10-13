const createNginxConfig = require('./create-nginx-config');
const createPhpConfig = require('./create-php-config');
const createPhpFpmConfig = require('./create-php-fpm-config');
const createPhpStormConfig = require('./create-php-storm-config');

/**
 * @type {() => import('listr2').ListrTask<import('../../../typings/context').ListrContext>}
 */
const prepareFileSystem = () => ({
    title: 'Preparing file system',
    task: (ctx, task) => task.newListr([
        createNginxConfig(),
        createPhpFpmConfig(),
        createPhpConfig(),
        createPhpStormConfig()
    ], {
        concurrent: true
    })
});

module.exports = {
    prepareFileSystem
};
