import * as mysql2 from 'mysql2'

import { ProjectConfig } from '../lib/config/config'
import { DockerVersionResult } from '../lib/tasks/docker/api'
import { systemApi } from '../lib/tasks/docker/system'
import { CMAConfiguration, PHPExtensions } from './index'
import { PHPStormConfig } from './phpstorm'

export interface ListrContext {
    throwMagentoVersionMissing: boolean
    projectPath: string
    systemDFData?: systemApi.SystemDFResult
    debug: boolean
    verbose: boolean
    magentoVersion: string
    composerVersion: string
    phpVersion: string
    port?: number
    ports?: {
        app: number
        fpm: number
        xdebug: number
        mariadb: number
        redis: number
        elasticsearch: number
        varnish: number
        sslTerminator: number
        maildevSMTP: number
        maildevWeb: number
    }
    arch: 'arm64' | 'x64'
    isArm: boolean
    isWsl: boolean
    isArmMac: boolean
    platform?: NodeJS.Platform
    platformVersion?: string
    /**
     * Magento Edition
     *
     * @default 'community'
     */
    edition?: 'community' | 'enterprise'
    config: {
        php: {
            iniTemplatePath: string
            fpmConfPath: string
            extensions: PHPExtensions
            version: string
        }
        composer: {
            dirPath: string
            binPath: string
            version: string
        }
        docker: {
            network: {
                name: string
            }
            volumes: Record<string,
                {
                    name: string,
                    driver?: string,
                    opt?: {
                        mode?: string,
                        device?: string,
                        o?: string,
                        type?: string
                    }
                }
            >
            getContainers(ports?: Record<string, number>): Record<
                | 'php'
                | 'sslTerminator'
                | 'nginx'
                | 'redis'
                | 'mariadb'
                | 'elasticsearch'
                | 'varnish',
                {
                    _: string
                    ports: string[]
                    healthCheck: {
                        cmd: string
                    }
                    env: Record<string, string>
                    mountVolumes: string[]
                    mounts: string[]
                    restart: string
                    securityOptions: string[]
                    network: string
                    image: string
                    debugImage?: string
                    remoteImages?: string[]
                    name: string
                    command: string
                    connectCommand: string[]
                }
            >
        }
        baseConfig: {
            prefix: string
            magentoDir: string
            templateDir: string
            cacheDir: string
            containerMagentoDir: string
        }
        overridenConfiguration: Omit<
            CMAConfiguration,
            'prefix' | 'useNonOverlappingPorts'
        >
        userConfiguration: Omit<
            CMAConfiguration,
            'prefix' | 'useNonOverlappingPorts'
        >
        nonOverridenConfiguration: Omit<
            CMAConfiguration,
            'prefix' | 'useNonOverlappingPorts'
        >
        phpStorm: PHPStormConfig
        projectConfig: ProjectConfig
    }
    systemConfiguration: {
        analytics: boolean
        useNonOverlappingPorts: boolean
    }
    databaseConnection: mysql2.Connection
    isSetupUpgradeNeeded?: boolean
    isDockerDesktop?: boolean
    dockerServerData?: DockerVersionResult['Server']
    dockerClientData?: DockerVersionResult['Client']
    dockerVersion?: DockerVersionResult['Server']['Version']
}
