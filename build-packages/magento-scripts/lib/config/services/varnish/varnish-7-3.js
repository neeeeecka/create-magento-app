const path = require('path')

/**
 * @param {Object} param0
 * @param {string} param0.templateDir
 * @returns {import('../../../../typings/index').VarnishConfiguration}
 */
const varnish73 = ({ templateDir }) => ({
    enabled: true,
    healthCheck: false,
    image: 'varnish:7.3',
    configTemplate: path.join(templateDir || '', 'varnish.template.vcl')
})

module.exports = varnish73
