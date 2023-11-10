const path = require('path')
const { repo } = require('../base-repo')
const xdebug = require('../extensions/xdebug')
const defaultPhpEnv = require('../default-php-env')

/**
 * @param {Object} param0
 * @param {string} param0.templateDir
 * @param {import('../../../../../typings/index').PHPExtensions} [param0.extensions]
 * @param {string} [param0.baseImage]
 * @returns {import('../../../../../typings/index').PHPConfiguration}
 */
const php74 = ({
    templateDir,
    extensions = {},
    baseImage = `${repo}:php-7.4`
}) => ({
    baseImage,
    debugImage: `${baseImage}-debug`,
    configTemplate: path.join(templateDir || '', 'php.template.ini'),
    fpmConfigTemplate: path.join(templateDir || '', 'php-fpm.template.conf'),
    debugTemplate: path.join(templateDir || '', 'php-debug.template.ini'),
    extensions: {
        xdebug,
        ...extensions
    },
    env: defaultPhpEnv
})

module.exports = php74
