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
const { mariadb103 } = require('../services/mariadb/versions');
const { elasticsearch79 } = require('../services/elasticsearch/versions');

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
        mariadb: mariadb103(),
        elasticsearch: elasticsearch79(),
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
