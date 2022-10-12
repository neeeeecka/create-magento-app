const defaultEnv = require('../default-es-env');

/**
 * @returns {import('../../../../../typings/index').ServiceWithImage}
 */
const elasticsearch79 = () => ({
    image: 'elasticsearch:7.9.3',
    env: defaultEnv
});

module.exports = elasticsearch79;
