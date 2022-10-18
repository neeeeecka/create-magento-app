/* eslint-disable max-len */
const { execAsyncSpawn } = require('../../../util/exec-async-command')

/**
 * @param {import('./container-api').ContainerRunOptions} options
 * @returns {string[]}
 */
const runCommand = (options) => {
    const {
        addHost,
        ports = [],
        mounts = [],
        mountVolumes = [],
        env,
        image,
        restart,
        network,
        name,
        entrypoint,
        command = '',
        healthCheck,
        securityOptions = [],
        tmpfs = [],
        expose = [],
        detach = true,
        rm = false,
        tty = false,
        user
    } = options

    const detachArg = detach && '-d'
    const rmArg = rm && '--rm'
    const ttyArg = tty && '-it'
    const exposeArg = expose && expose.map((e) => `--expose=${e}`)
    const restartArg = !rm && restart && `--restart=${restart}`
    const networkArg = network && `--network=${network}`
    const portsArgs =
        ports && ports.length > 0 && ports.map((port) => `-p=${port}`)
    const mountsArgs = mounts && mounts.map((mount) => `--mount="${mount}"`)
    const mountVolumesArgs =
        mountVolumes && mountVolumes.map((mount) => `-v="${mount}"`)
    const envArgs = !env
        ? ''
        : Object.entries(env).map(([key, value]) => `--env=${key}='${value}'`)
    const nameArg = name && `--name=${name}`
    const entrypointArg = entrypoint && `--entrypoint="${entrypoint}"`
    const healthCheckArg =
        healthCheck &&
        Object.entries(healthCheck).map(
            ([key, value]) => `--health-${key}='${value}'`
        )
    const securityArg =
        securityOptions.length > 0 &&
        securityOptions.map((opt) => `--security-opt=${opt}`)
    const tmpfsArg = tmpfs.length > 0 && tmpfs.map((t) => `--tmpfs=${t}`)
    const userArg = user && `--user=${user}`
    const addHostArg = addHost && `--add-host=${addHost}`

    const dockerCommand = [
        'docker',
        'run',
        nameArg,
        ttyArg,
        detachArg,
        rmArg,
        networkArg,
        restartArg,
        portsArgs,
        exposeArg,
        mountsArgs,
        mountVolumesArgs,
        envArgs,
        entrypointArg,
        healthCheckArg,
        securityArg,
        tmpfsArg,
        userArg,
        addHostArg,
        image,
        command
    ]
        .flat()
        .filter(Boolean)
        .filter((arg) => typeof arg === 'string')

    return dockerCommand
}

/**
 * @param {import('./container-api').ContainerRunOptions} options
 * @param {import('../../../util/exec-async-command').ExecAsyncSpawnOptions<false>} execOptions
 */
const run = (options, execOptions = {}) =>
    execAsyncSpawn(runCommand(options).join(' '), execOptions)

/**
 * @param {string} command
 * @param {string} container container id or name
 * @param {import('./container-api').ContainerExecOptions} options
 * @param {import('../../../util/exec-async-command').ExecAsyncSpawnOptions<false>} execOptions
 */
const exec = (command, container, options = {}, execOptions = {}) => {
    const { env, tty, user, workdir } = options
    const envArgs = !env
        ? ''
        : Object.entries(env)
              .map(([key, value]) => `--env ${key}='${value}'`)
              .join(' ')
    const ttyArg = tty ? '--tty' : ''
    const userArg = user ? `--user=${user}` : ''
    const workdirArg = workdir ? `--workdir=${workdir}` : ''

    const execCommand = [
        'docker',
        'container',
        'exec',
        envArgs,
        ttyArg,
        userArg,
        workdirArg,
        container,
        command
    ]
        .filter(Boolean)
        .join(' ')

    return execAsyncSpawn(execCommand, execOptions)
}

/**
 * @param {import('./container-api').ContainerLsOptions} options
 * @param {import('../../../util/exec-async-command').ExecAsyncSpawnOptions<false>} execOptions
 */
const ls = async (options = {}, execOptions = {}) => {
    const {
        all,
        filter,
        format,
        formatToJSON = false,
        latest,
        noTrunc,
        quiet
    } = options

    const allArg = all && '--all'
    const filterArg =
        filter && typeof filter === 'string'
            ? `--filter=${filter}`
            : filter &&
              Array.isArray(filter) &&
              filter.every((f) => typeof f === 'string') &&
              filter.map((f) => `--filter=${f}`).join(' ')
    const formatArg =
        !formatToJSON && format
            ? `--format=${format}`
            : formatToJSON && "--format='{{json .}}'"
    const latestArg = latest && '--latest'
    const noTruncArg = noTrunc && '--no-trunc'
    const quietArg = quiet && '--quiet'

    const args = [allArg, filterArg, formatArg, latestArg, noTruncArg, quietArg]
        .filter(Boolean)
        .join(' ')

    if (formatToJSON) {
        const result = await execAsyncSpawn(
            `docker container ls ${args}`,
            execOptions
        )
        if (result.startsWith('[')) {
            return JSON.parse(result)
        }

        return JSON.parse(`[${result.split('\n').join(', ')}]`)
    }

    return execAsyncSpawn(`docker container ls ${args}`, execOptions)
}

/**
 * @param {import('./container-api').ContainerLogsOptions} options
 * @param {import('../../../util/exec-async-command').ExecAsyncSpawnOptions<false>} execOptions
 */
const logs = async (options = {}, execOptions = {}) => {
    const {
        name,
        details = false,
        follow = false,
        since = '',
        tail = '',
        timestamps = false,
        until = '',
        parser
    } = options
    const detailsArg = details && '--details'
    const followArg = follow && '--follow'
    const sinceArg = since && `--since=${since}`
    const tailArg = tail && `--tail=${tail}`
    const timestampsArg = timestamps && '--timestamps'
    const untilArg = until && `--until=${until}`

    const logsCommand = [
        'docker',
        'container',
        'logs',
        detailsArg,
        followArg,
        sinceArg,
        tailArg,
        timestampsArg,
        untilArg,
        name
    ]
        .filter(Boolean)
        .join(' ')

    if (parser) {
        const result = await execAsyncSpawn(logsCommand, execOptions)

        return result.split('\n').map((line) => parser(line))
    }

    return execAsyncSpawn(logsCommand, execOptions)
}

const stop = (containers, execOptions = {}) =>
    execAsyncSpawn(`docker container stop ${containers.join(' ')}`, execOptions)

const rm = (containers, execOptions = {}) =>
    execAsyncSpawn(`docker container rm ${containers.join(' ')}`, execOptions)

module.exports = {
    run,
    runCommand,
    exec,
    ls,
    logs,
    stop,
    rm
}
