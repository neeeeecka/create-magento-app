const { defaultMagentoConfig } = require('../magento-config');
const sodium = require('../php/extensions/sodium');
const { magento24PHPExtensionList } = require('../magento/required-php-extensions');
const { php74 } = require('../php/versions');
const { sslTerminator } = require('../services/ssl-terminator');
const { varnish66 } = require('../varnish/varnish-6-6');
const { repo } = require('../php/base-repo');
const { nginx118 } = require('../services/nginx/versions');
const { composer1 } = require('../services/composer/versions');
const { maildev } = require('../services/maildev');

module.exports = ({ templateDir } = {}) => ({
    magentoVersion: '2.4.1',
    configuration: {
        php: php74({
            templateDir,
            extensions: { ...magento24PHPExtensionList, sodium },
            baseImage: `${ repo }:php-7.4-magento-2.4`
        }),
        nginx: nginx118({ templateDir }),
        redis: {
            version: '6.0.10-alpine'
        },
        mysql: {
            version: '8.0'
        },
        mariadb: {
            version: '10.4'
        },
        elasticsearch: {
            version: '7.12.1'
        },
        composer: composer1(),
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
