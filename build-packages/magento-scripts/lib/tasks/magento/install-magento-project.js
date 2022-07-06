const path = require('path');
const os = require('os');
const runComposerCommand = require('../../util/run-composer');
const matchFilesystem = require('../../util/match-filesystem');
const moveFile = require('../../util/move-file');
const pathExists = require('../../util/path-exists');
const getJsonFileData = require('../../util/get-jsonfile-data');
const rmdirSafe = require('../../util/rmdir-safe');
const KnownError = require('../../errors/known-error');
const UnknownError = require('../../errors/unknown-error');
const logger = require('@scandipwa/scandipwa-dev-utils/logger');

const magentoProductEnterpriseEdition = 'magento/product-enterprise-edition';
const magentoProductCommunityEdition = 'magento/product-community-edition';

/**
 * Adjust composer.json file configuration for magento
 */
const adjustComposerJson = async ({
    baseConfig,
    magentoEdition,
    magentoProductSelectedEdition,
    magentoVersion,
    magentoPackageVersion,
    task,
    verbose
}) => {
    const composerData = await getJsonFileData(path.join(baseConfig.magentoDir, 'composer.json'));

    // fix composer magento repository
    if (composerData && (!composerData.repositories
        || (Array.isArray(composerData.repositories)
            && !composerData.repositories.some((repo) => repo.type === 'composer' && repo.url.includes('repo.magento.com'))
        )
        || (typeof composerData.repositories === 'object'
            && !Object.values(composerData.repositories).some((repo) => repo.type === 'composer' && repo.url.includes('repo.magento.com')))
    )) {
        task.output = 'No Magento repository is set in composer.json! Setting up...';
        await runComposerCommand('config repo.0 composer https://repo.magento.com', {
            magentoVersion,
            callback: !verbose ? undefined : (t) => {
                task.output = t;
            }
        });
    }

    // if composer-root-update-plugin is not installed in composer, install it.
    if (composerData && !composerData.require['magento/composer-root-update-plugin']) {
        task.output = 'Installing magento/composer-root-update-plugin!';
        await runComposerCommand('require magento/composer-root-update-plugin:^1',
            {
                magentoVersion,
                callback: !verbose ? undefined : (t) => {
                    task.output = t;
                }
            });
    }

    // if for some reason both editions are installed, throw an error
    if (composerData
        && composerData.require[magentoProductCommunityEdition]
        && composerData.require[magentoProductEnterpriseEdition]
    ) {
        throw new KnownError('Somehow, both Magento editions are installed!\nPlease choose only one edition an modify your composer.json manually!');
    }

    const oppositeEdition = [magentoProductCommunityEdition, magentoProductEnterpriseEdition]
        .find((edition) => edition !== magentoProductSelectedEdition);

    // if opposite edition is installed than selected in config file, throw an error
    if (composerData && composerData.require[oppositeEdition]) {
        throw new KnownError(`You have installed ${oppositeEdition} but selected magento.edition as ${magentoEdition} in config file!

Change magento edition in config file or manually reinstall correct magento edition!`);
    }

    // if magento package is not installed in composer, require it.

    if (composerData && !composerData.require[magentoProductSelectedEdition]) {
        task.output = `Installing ${magentoProductSelectedEdition}=${magentoPackageVersion}!`;
        await runComposerCommand(`require ${magentoProductSelectedEdition}:${magentoPackageVersion}`,
            {
                magentoVersion,
                callback: !verbose ? undefined : (t) => {
                    task.output = t;
                }
            });
    }
};

/**
 * Create Magento Project
 */
const createMagentoProject = async ({
    magentoProject,
    magentoPackageVersion,
    magentoVersion,
    task,
    verbose
}) => {
    const tempDir = path.join(os.tmpdir(), `magento-tmpdir-${Date.now()}`);
    const installCommand = [
        'create-project',
        `--repository=https://repo.magento.com/ ${magentoProject}=${magentoPackageVersion}`,
        '--no-install',
        `"${tempDir}"`
    ];

    await runComposerCommand(
        installCommand.join(' '),
        {
            magentoVersion,
            callback: !verbose ? undefined : (t) => {
                task.output = t;
            }
        }
    );

    await moveFile({
        from: path.join(tempDir, 'composer.json'),
        to: path.join(process.cwd(), 'composer.json')
    });

    await rmdirSafe(tempDir);
};

/**
 * @returns {import('listr2').ListrTask<import('../../../typings/context').ListrContext>}
 */
const installMagentoProject = () => ({
    title: 'Installing Magento Project',
    task: async (ctx, task) => {
        const { magentoVersion, config: { baseConfig, overridenConfiguration }, verbose } = ctx;
        const {
            magento: { edition: magentoEdition },
            magentoVersion: magentoPackageVersion
        } = overridenConfiguration;
        const isEnterprise = magentoEdition === 'enterprise';
        const magentoProductSelectedEdition = isEnterprise ? magentoProductEnterpriseEdition : magentoProductCommunityEdition;
        const magentoProject = `magento/project-${magentoEdition}-edition`;

        if (await pathExists(path.join(baseConfig.magentoDir, 'composer.json'))) {
            await adjustComposerJson({
                baseConfig,
                isEnterprise,
                magentoEdition,
                magentoPackageVersion,
                magentoProductSelectedEdition,
                magentoVersion,
                task,
                verbose
            });
        }

        const isFsMatching = await matchFilesystem(baseConfig.magentoDir, {
            'app/etc': [
                'env.php'
            ],
            'bin/magento': true,
            vendor: true,
            'composer.json': true,
            'composer.lock': true
        });

        if (isFsMatching) {
            ctx.magentoFirstInstall = false;
            task.skip();
            return;
        }

        task.title = `Installing Magento ${magentoPackageVersion}`;
        task.output = 'Creating Magento project';

        if (!await pathExists(path.join(process.cwd(), 'composer.json'))) {
            await createMagentoProject({
                magentoProject,
                magentoPackageVersion,
                magentoVersion,
                task,
                verbose
            });
        }
        try {
            await runComposerCommand('install',
                {
                    magentoVersion,
                    callback: !verbose ? undefined : (t) => {
                        task.output = t;
                    }
                });
        } catch (e) {
            if (e.message.includes('man-in-the-middle attack')) {
                throw new KnownError(`Probably you haven't setup pubkeys in composer.
Please run ${logger.style.command('composer diagnose')} in cli to get mode.\n\n${e}`);
            }

            throw new UnknownError(`Unexpected error during composer install.\n\n${e}`);
        }
        ctx.magentoFirstInstall = true;
    },
    options: {
        bottomBar: 10
    }
});

module.exports = installMagentoProject;
