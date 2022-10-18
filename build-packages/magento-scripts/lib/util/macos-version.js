const semver = require('semver')
const macosVersion = require('macos-version')
const { execAsyncSpawn } = require('./exec-async-command')

const getMacOSVersion = async () => {
    const { code, result } = await execAsyncSpawn('sw_vers -productVersion', {
        withCode: true
    })

    if (code !== 0) {
        return macosVersion()
    }

    return semver.coerce(result).version
}

module.exports = {
    getMacOSVersion
}
