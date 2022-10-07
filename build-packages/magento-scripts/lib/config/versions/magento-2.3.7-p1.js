const { defaultMagentoConfig } = require('../magento-config');
const { magento23PHPExtensionList } = require('../magento/required-php-extensions');
const { repo } = require('../services/php/base-repo');
const { php74 } = require('../services/php/versions');
const { composer2 } = require('../services/composer/versions');
const { maildev } = require('../services/maildev');
const { nginx118 } = require('../services/nginx/versions');
const { redis60 } = require('../services/redis');
const { sslTerminator } = require('../services/ssl-terminator');
const { varnish66 } = require('../services/varnish');

module.exports = ({ templateDir } = {}) => ({
    magentoVersion: '2.3.7-p1',
    configuration: {
        php: php74({
            templateDir,
            extensions: magento23PHPExtensionList,
            baseImage: `${ repo }:php-7.4-magento-2.3`
        }),
        nginx: nginx118({ templateDir }),
        redis: redis60(),
        mysql: {
            version: '5.7'
        },
        mariadb: {
            version: '10.2'
        },
        elasticsearch: {
            version: '7.9.3'
        },
        composer: composer2(),
        varnish: varnish66({ templateDir }),
        sslTerminator: sslTerminator({ templateDir }),
        maildev: maildev()
    },
    magento: defaultMagentoConfig,
    host: 'localhost',
    ssl: {
        enabled: false
    }
});
