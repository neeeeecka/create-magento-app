/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
// const runComposerCommand = require('../../../util/run-composer');
const runMagentoCommand = require('../../../util/run-magento');
const adjustMagentoConfiguration = require('./adjust-magento-configuration');
const configureElasticsearch = require('./configure-elasticsearch');
const installMagento = require('./install-magento');
const upgradeMagento = require('./upgrade-magento');

const migrateDatabase = {
    title: 'Migrating database',
    task: async (ctx, task) => {
        const { magentoVersion, mysqlConnection: connection } = ctx;

        const [[{ tableCount }]] = await connection.query(`
            SELECT count (*) AS tableCount
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = 'magento';
        `);

        if (tableCount === 0) {
            task.output = 'No Magento is installed in DB!\nInstalling...';

            return task.newListr([
                installMagento,
                configureElasticsearch
            ], {
                concurrent: false,
                exitOnError: true,
                ctx
            });
        }
        const { code } = await runMagentoCommand('setup:db:status', {
            magentoVersion,
            throwNonZeroCode: false
        });

        switch (code) {
        case 0: {
            // no setup is needed, but still to be sure configure ES
            return task.newListr([configureElasticsearch], {
                concurrent: false,
                exitOnError: true,
                ctx
            });
        }
        case 1: {
            return task.newListr([
                installMagento,
                configureElasticsearch
            ], {
                concurrent: false,
                exitOnError: true,
                ctx
            });
        }
        case 2: {
            task.output = 'Migrating database: upgrade magento';
            return task.newListr([
                adjustMagentoConfiguration,
                configureElasticsearch,
                upgradeMagento
            ], {
                concurrent: false,
                exitOnError: true,
                ctx
            });
        }
        default: {
        // TODO: handle these statuses ?
            task.title = 'Migrating database failed: manual action is required!';
            break;
        }
        }
    },
    options: {
        bottomBar: 10
    }
};

module.exports = migrateDatabase;
