const deepmerge = require('../util/deepmerge');

/**
 * @type {import('../../typings/index').CMAConfiguration['magento']}
 */
const defaultMagentoConfig = {
    first_name: 'Scandiweb',
    last_name: 'Developer',
    email: 'developer@scandipwa.com',
    user: 'admin',
    password: 'scandipwa123',
    adminuri: 'admin',
    mode: 'developer',
    edition: 'community'
};

const getMagentoConfig = (magento) => deepmerge(defaultMagentoConfig, magento);

module.exports = {
    defaultMagentoConfig,
    getMagentoConfig
};
