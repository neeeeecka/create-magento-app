const path = require('path');

module.exports = () => {
    const phpStormConfiguration = {
        xdebug: {
            v2Port: '9111',
            v3Port: '9003',
            debugServerAddress: 'http://localhost',
            serverName: 'create-magento-app',
            runManagerName: 'create-magento-app',
            sessionId: 'PHPSTORM',
            path: path.join(process.cwd(), '.idea', 'workspace.xml'),
            templatePath: path.join(__dirname, 'templates', 'workspace.template.xml')
        },
        php: {
            version: '7.4',
            path: path.join(process.cwd(), '.idea', 'php.xml'),
            templatePath: path.join(__dirname, 'templates', 'php.template.xml')
        }
    };

    return phpStormConfiguration;
};
