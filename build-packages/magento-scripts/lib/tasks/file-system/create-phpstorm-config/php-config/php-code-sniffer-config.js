const path = require('path');
const pathExists = require('../../../../util/path-exists');
const { nameKey, toolPathKey, standardsKey } = require('../keys');
const { formatPathForPHPStormConfig } = require('../xml-utils');

const PHP_CODE_SNIFFER_COMPONENT_NAME = 'PhpCodeSniffer';

const beautifierPathKey = '@_beautifier_path';

const phpCodeSnifferStandards = 'MySource;PEAR;PHPCompatibility;PSR1;PSR12;PSR2;Squiz;Zend';
const phpCodeSnifferBinaryPath = path.join(process.cwd(), 'vendor', 'bin', 'phpcs');
const phpCodeSnifferBinaryFormattedPath = formatPathForPHPStormConfig(phpCodeSnifferBinaryPath);

const phpCodeSnifferBeautifierBinaryPath = path.join(process.cwd(), 'vendor', 'bin', 'phpcbf');
const phpCodeSnifferBeautifierBinaryFormattedPath = formatPathForPHPStormConfig(phpCodeSnifferBeautifierBinaryPath);

/**
 * @param {Array} phpConfigs
 * @returns {Promise<Boolean>}
 */
const setupPHPCodeSniffer = async (phpConfigs) => {
    let hasChanges = false;
    const phpCodeSnifferComponent = phpConfigs.find(
        (phpConfig) => phpConfig[nameKey] === PHP_CODE_SNIFFER_COMPONENT_NAME
    );

    const isPhpCodeSnifferBinPathExists = await pathExists(phpCodeSnifferBinaryPath);
    const isPhpCodeSnifferBeautifierBinPathExists = await pathExists(phpCodeSnifferBeautifierBinaryPath);
    const isAllPHPCSBinsExists = isPhpCodeSnifferBinPathExists && isPhpCodeSnifferBeautifierBinPathExists;

    if (phpCodeSnifferComponent && isAllPHPCSBinsExists) {
        if (!Array.isArray(phpCodeSnifferComponent.phpcs_settings)) {
            hasChanges = true;
            phpCodeSnifferComponent.phpcs_settings = [phpCodeSnifferComponent.phpcs_settings];
        }

        const phpCodeSnifferConfiguration = phpCodeSnifferComponent.phpcs_settings.find(
            (phpcsSetting) => phpcsSetting.PhpCSConfiguration
        );

        if (phpCodeSnifferConfiguration) {
            if (phpCodeSnifferConfiguration[toolPathKey] !== phpCodeSnifferBinaryFormattedPath) {
                hasChanges = true;
                phpCodeSnifferConfiguration[toolPathKey] = phpCodeSnifferBinaryFormattedPath;
            }

            if (phpCodeSnifferConfiguration[standardsKey] !== phpCodeSnifferStandards) {
                hasChanges = true;
                phpCodeSnifferConfiguration[standardsKey] = phpCodeSnifferStandards;
            }

            if (phpCodeSnifferConfiguration[beautifierPathKey] !== phpCodeSnifferBeautifierBinaryFormattedPath) {
                hasChanges = true;
                phpCodeSnifferConfiguration[beautifierPathKey] = phpCodeSnifferBeautifierBinaryFormattedPath;
            }
        } else {
            hasChanges = true;
            phpCodeSnifferComponent.phpcsfixer_settings.push({
                PhpCSConfiguration: {
                    [toolPathKey]: phpCodeSnifferBinaryFormattedPath,
                    [standardsKey]: phpCodeSnifferStandards,
                    [beautifierPathKey]: phpCodeSnifferBeautifierBinaryFormattedPath
                }
            });
        }
    } else if (isAllPHPCSBinsExists) {
        hasChanges = true;
        phpConfigs.push({
            [nameKey]: PHP_CODE_SNIFFER_COMPONENT_NAME,
            phpcs_settings: [
                {
                    PhpCSConfiguration: {
                        [toolPathKey]: phpCodeSnifferBinaryFormattedPath,
                        [standardsKey]: phpCodeSnifferStandards,
                        [beautifierPathKey]: phpCodeSnifferBeautifierBinaryFormattedPath
                    }
                }
            ]
        });
    }

    return hasChanges;
};

module.exports = setupPHPCodeSniffer;
