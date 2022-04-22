/* eslint-disable no-param-reassign */
const { loadXmlFile, buildXmlFile } = require('../../../config/xml-parser');
const pathExists = require('../../../util/path-exists');
const setConfigFile = require('../../../util/set-config');

/**
 * Get link to data-source field, create fields if necessary
 *
 * @param {Object} data
 * @param {Object} defaultData Default data structure that will be used if original data is missing
 */
const getToDataSource = (data, defaultData) => {
    if (!data.project) {
        data.project = defaultData.project;
    }

    if (!data.project.component) {
        data.project.component = defaultData.project.component;
    }

    if (!data.project.component['data-source']) {
        data.project.component['data-source'] = defaultData.project.component['data-source'];
    }

    return data.project.component['data-source'];
};

/**
 * @type {() => import('listr2').ListrTask<import('../../../../typings/context').ListrContext>}
 */
const setupDataSourceLocalConfig = () => ({
    title: 'Set up datasource local configuration',
    task: async (ctx, task) => {
        const {
            config: {
                phpStorm,
                phpStorm: {
                    database
                }
            }
        } = ctx;

        if (await pathExists(database.dataSourcesLocal.path)) {
            let hasChanges = false;
            const dataSourcesLocalData = await loadXmlFile(database.dataSourcesLocal.path);
            const dataSource = getToDataSource(
                dataSourcesLocalData,
                {
                    project: {
                        '@_version': '4',
                        component: {
                            '@_name': 'dataSourceStorageLocal',
                            '@_created-in': 'PS-212.5284.49',
                            'data-source': {
                                '@_uuid': 'a2eadb3c-6fc9-4d85-b5f4-d8114906ce2f'
                            }
                        }
                    }
                }
            );

            if (dataSource['@_name'] !== database.dataSourceManagerName) {
                hasChanges = true;
                dataSource['@_name'] = database.dataSourceManagerName;
            }

            if (dataSource['@_uuid'] === undefined) {
                hasChanges = true;
                dataSource['@_uuid'] = 'a2eadb3c-6fc9-4d85-b5f4-d8114906ce2f';
            }

            const defaultDatabaseInfoConfig = {
                '@_product': '',
                '@_version': '',
                '@_jdbc-version': '',
                '@_driver-name': '',
                '@_driver-version': '',
                '@_dbms': 'MYSQL',
                '@_exact-version': '0'
            };
            const isDatabaseInfoChangeNeeded = dataSource['database-info']
                ? Object.entries(defaultDatabaseInfoConfig)
                    .some(([key, value]) => dataSource['database-info'][key] !== value)
                : true;

            if (isDatabaseInfoChangeNeeded) {
                hasChanges = true;
                if (!dataSource['database-info']) {
                    dataSource['database-info'] = defaultDatabaseInfoConfig;
                } else {
                    Object.entries(defaultDatabaseInfoConfig).forEach(([key, value]) => {
                        dataSource['database-info'][key] = value;
                    });
                }
            }

            const dataSourceDefaultData = {
                'secret-storage': 'master_key',
                'user-name': 'magento',
                'schema-mapping': ''
            };

            const isDataSourceDataChangeNeeded = dataSource
                ? Object.entries(dataSourceDefaultData)
                    .some(([key, value]) => dataSource[key] !== value)
                : true;

            if (isDataSourceDataChangeNeeded) {
                hasChanges = true;
                Object.entries(dataSourceDefaultData).forEach(([key, value]) => {
                    dataSource[key] = value;
                });
            }

            if (hasChanges) {
                await buildXmlFile(database.dataSourcesLocal.path, dataSourcesLocalData);
            } else {
                task.skip();
            }
        } else {
            try {
                await setConfigFile({
                    configPathname: phpStorm.database.dataSourcesLocal.path,
                    template: phpStorm.database.dataSourcesLocal.templatePath,
                    overwrite: true,
                    templateArgs: {
                        phpStorm
                    }
                });
            } catch (e) {
                throw new Error(`Unexpected error accrued during dataSources.local.xml config creation\n\n${e}`);
            }
        }
    }
});

/**
 * @type {() => import('listr2').ListrTask<import('../../../../typings/context').ListrContext>}
 */
const setupDataSourceConfig = () => ({
    task: async (ctx, task) => {
        const {
            config: {
                phpStorm,
                phpStorm: {
                    database
                }
            },
            ports
        } = ctx;
        const jdbcUrl = `jdbc:mysql://localhost:${ports.mysql}/magento`;

        if (await pathExists(database.dataSources.path)) {
            let hasChanges = false;
            const dataSourcesData = await loadXmlFile(database.dataSources.path);
            const dataSource = getToDataSource(
                dataSourcesData,
                {
                    project: {
                        '@_version': '4',
                        component: {
                            '@_name': 'DataSourceManagerImpl',
                            '@_format': 'xml',
                            '@_multifile-model': true,
                            'data-source': {
                                '@_source': 'LOCAL',
                                '@_uuid': 'a2eadb3c-6fc9-4d85-b5f4-d8114906ce2f'
                            }
                        }
                    }
                }
            );

            if (dataSource['@_uuid'] === undefined) {
                hasChanges = true;
                dataSource['@_uuid'] = 'a2eadb3c-6fc9-4d85-b5f4-d8114906ce2f';
            }

            const expectedDataSourceData = {
                '@_name': database.dataSourceManagerName,
                'driver-ref': 'mysql.8',
                synchronize: true,
                'jdbc-driver': 'com.mysql.cj.jdbc.Driver',
                'jdbc-url': jdbcUrl,
                'working-dir': '$ProjectFileDir$',
                '@_source': 'LOCAL'
            };

            const isDataSourceNeedChanges = dataSource
                ? Object.entries(expectedDataSourceData)
                    .some(([key, value]) => dataSource[key] !== value)
                : true;

            if (isDataSourceNeedChanges) {
                hasChanges = true;
                if (!dataSource) {
                    dataSourcesData.project.component['data-source'] = expectedDataSourceData;
                } else {
                    Object.entries(expectedDataSourceData).forEach(([key, value]) => {
                        dataSource[key] = value;
                    });
                }
            }

            if (hasChanges) {
                await buildXmlFile(database.dataSources.path, dataSourcesData);
            } else {
                task.skip();
            }
        } else {
            try {
                await setConfigFile({
                    configPathname: phpStorm.database.dataSources.path,
                    template: phpStorm.database.dataSources.templatePath,
                    overwrite: true,
                    templateArgs: {
                        phpStorm,
                        jdbcUrl
                    }
                });
            } catch (e) {
                throw new Error(`Unexpected error accrued during dataSources.xml config creation\n\n${e}`);
            }
        }
    }
});

/**
 * @type {() => import('listr2').ListrTask<import('../../../../typings/context').ListrContext>}
 */
const setupDatabaseConfig = () => ({
    title: 'Set up database configuration',
    task: (ctx, task) => task.newListr([
        setupDataSourceLocalConfig(),
        setupDataSourceConfig()
    ])
});

module.exports = setupDatabaseConfig;
