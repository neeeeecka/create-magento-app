const path = require('path');
const { baseConfig } = require('../../../../config');

/**
 * @param {import('../../../../../typings/index').CMAConfiguration} app
 */
const getWorkspaceConfig = (app) => ({
    v2Port: '9111',
    v3Port: '9003',
    debugServerAddress: `http://${ app.host }`,
    serverName: 'create-magento-app',
    runManagerName: 'create-magento-app',
    sessionId: 'PHPSTORM',
    path: path.join(process.cwd(), '.idea', 'workspace.xml'),
    templatePath: path.join(baseConfig.templateDir, 'workspace.template.xml')
});

module.exports = {
    getWorkspaceConfig
};