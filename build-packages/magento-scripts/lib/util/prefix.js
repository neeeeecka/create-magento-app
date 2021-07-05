const path = require('path');
const fs = require('fs');
const { projectsConfig, projectKey } = require('../config/config');

const { base: folderName } = path.parse(process.cwd());

const getPrefix = () => {
    const projectInGlobalConfig = projectsConfig.get(projectKey);
    const projectStat = fs.statSync(process.cwd());
    const projectCreatedAt = Math.floor(projectStat.birthtime.getTime() / 1000).toString();

    if (!projectInGlobalConfig || !projectInGlobalConfig.createdAt) {
        // if createdAt property does not set in config, means that project is threaded as legacy
        // so it uses docker volumes and containers names without prefixes, so it doesn't have creation date
        // as it's unknown
        projectsConfig.set(projectKey, {
            prefix: '',
            createdAt: projectCreatedAt
        });
    }

    if (projectInGlobalConfig && projectInGlobalConfig.prefix) {
        return `${folderName}-${projectInGlobalConfig.prefix}`;
    }

    return folderName;
};

const getProjectCreatedAt = () => {
    const projectInGlobalConfig = projectsConfig.get(projectKey);

    if (projectInGlobalConfig && projectInGlobalConfig.createdAt) {
        return new Date(parseInt(projectInGlobalConfig.createdAt, 10) * 1000);
    }

    return null;
};

const setPrefix = (usePrefix) => {
    const projectInGlobalConfig = projectsConfig.get(projectKey);
    if (projectInGlobalConfig) {
        if (usePrefix && !projectInGlobalConfig.prefix) {
            const createdAt = projectInGlobalConfig.createdAt || Math.floor(fs.statSync(process.cwd()).birthtime.getTime() / 1000).toString();
            projectsConfig.set(`${projectKey}.prefix`, createdAt);
        }
        if (!usePrefix && projectInGlobalConfig.prefix) {
            projectsConfig.set(`${projectKey}.prefix`, '');
        }
    }
};

module.exports = {
    setPrefix,
    getPrefix,
    getProjectCreatedAt
};
