/**
 * @returns {import('../../../../../typings/index').MariaDBConfiguration}
 */
const mariadb103 = () => ({
    image: 'mariadb:10.3',
    useOptimizerSwitch: false
})

module.exports = mariadb103
