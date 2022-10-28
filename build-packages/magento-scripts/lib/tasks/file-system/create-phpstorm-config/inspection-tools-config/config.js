// inspection tool classes
const PHP_CS_FIXER_VALIDATION_INSPECTION = 'PhpCSFixerValidationInspection'
const PHP_CS_VALIDATION_INSPECTION = 'PhpCSValidationInspection'
const STYLELINT_INSPECTION = 'Stylelint'
const ESLINT_INSPECTION = 'Eslint'
const MESS_DETECTOR_VALIDATION_INSPECTION = 'MessDetectorValidationInspection'

// options
const CODING_STANDARD_OPTION_NAME = 'CODING_STANDARD'
const CUSTOM_CODING_STANDARD_OPTION_VALUE = 'Custom'
const CUSTOM_RULE_SET_PATH_OPTION_NAME = 'CUSTOM_RULESET_PATH'
const MAGENTO2_CODING_STANDARD_OPTION_VALUE = 'Magento2'
const EXTENSIONS_OPTION_NAME = 'EXTENSIONS'
const WARNING_HIGHLIGHT_LEVEL_NAME_OPTION_NAME = 'WARNING_HIGHLIGHT_LEVEL_NAME'
const WARNING_HIGHLIGHT_LEVEL_NAME_OPTION_VALUE = 'ERROR'
const SHOW_SNIFF_NAMES_OPTION_NAME = 'SHOW_SNIFF_NAMES'
const USE_INSTALLED_PATHS_OPTION_NAME = 'USE_INSTALLED_PATHS'
const INSTALLED_PATHS_OPTION_NAME = 'INSTALLED_PATHS'
const CODESIZE_OPTION_NAME = 'CODESIZE'
const CONTROVERSIAL_OPTION_NAME = 'CONTROVERSIAL'
const DESIGN_OPTION_NAME = 'DESIGN'
const UNUSED_CODE_OPTION_NAME = 'UNUSEDCODE'
const NAMING_OPTION_NAME = 'NAMING'
const CUSTOM_RULESETS_OPTION_NAME = 'customRulesets'
const PHP_MD_RULESET_OPTION_VALUE = 'Magento PHPMD rule set'

module.exports = {
    options: {
        CODESIZE_OPTION_NAME,
        CONTROVERSIAL_OPTION_NAME,
        DESIGN_OPTION_NAME,
        UNUSED_CODE_OPTION_NAME,
        NAMING_OPTION_NAME,
        CUSTOM_RULESETS_OPTION_NAME,
        PHP_MD_RULESET_OPTION_VALUE,
        CODING_STANDARD_OPTION_NAME,
        CUSTOM_CODING_STANDARD_OPTION_VALUE,
        CUSTOM_RULE_SET_PATH_OPTION_NAME,
        MAGENTO2_CODING_STANDARD_OPTION_VALUE,
        EXTENSIONS_OPTION_NAME,
        WARNING_HIGHLIGHT_LEVEL_NAME_OPTION_NAME,
        WARNING_HIGHLIGHT_LEVEL_NAME_OPTION_VALUE,
        SHOW_SNIFF_NAMES_OPTION_NAME,
        USE_INSTALLED_PATHS_OPTION_NAME,
        INSTALLED_PATHS_OPTION_NAME
    },
    classes: {
        PHP_CS_FIXER_VALIDATION_INSPECTION,
        PHP_CS_VALIDATION_INSPECTION,
        STYLELINT_INSPECTION,
        ESLINT_INSPECTION,
        MESS_DETECTOR_VALIDATION_INSPECTION
    }
}
