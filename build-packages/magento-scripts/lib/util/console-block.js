/* eslint-disable no-control-regex */
/**
 * @typedef {'header' | 'separator' | 'line' | 'empty-line'} BlockType
 *
 * @typedef {{ type: BlockType, data: string }} Block
 */

const logger = require('@scandipwa/scandipwa-dev-utils/logger');

const HORIZONTAL_SEPARATOR = '-';
const VERTICAL_SEPARATOR = '|';
const EMPTY_CHAR = ' ';
const TOP_LEFT_SEPARATOR = '┌';
const TOP_RIGHT_SEPARATOR = '┐';
const MIDDLE_LEFT_SEPARATOR = '├';
const MIDDLE_RIGHT_SEPARATOR = '┤';
const BOTTOM_LEFT_SEPARATOR = '└';
const BOTTOM_RIGHT_SEPARATOR = '┘';

class ConsoleBlock {
    constructor() {
        /**
         * @type {Block[]}
         */
        this.data = [];
    }

    /**
     * @param {string} header
     */
    addHeader(header) {
        this.data.unshift(
            {
                type: 'header',
                data: header
            }
        );

        return this;
    }

    addEmptyLine() {
        this.data.push({
            type: 'empty-line'
        });

        return this;
    }

    /**
     * @param {string} line
     */
    addLine(line) {
        this.data.push({
            type: 'line',
            data: line
        });

        return this;
    }

    /**
     * @param {string} separator
     */
    addSeparator(separator) {
        this.data.push({
            type: 'separator',
            data: separator
        });

        return this;
    }

    log() {
        const longestLineRaw = this.data.reduce((acc, { data = '' }) => (data.length > acc ? data.length : acc), 0);
        const longestLine = longestLineRaw % 2 === 0 ? longestLineRaw : longestLineRaw + 1;

        logger.log('');

        this.data.forEach(({ type, data }) => {
            switch (type) {
            case 'header': {
                const spacersLength = (longestLine - data.length) / 2;

                logger.log(`${TOP_LEFT_SEPARATOR}${HORIZONTAL_SEPARATOR.repeat(spacersLength)}${EMPTY_CHAR}${data}${EMPTY_CHAR}${HORIZONTAL_SEPARATOR.repeat(spacersLength)}${TOP_RIGHT_SEPARATOR}`);
                break;
            }

            case 'line': {
                logger.log(`${VERTICAL_SEPARATOR}${EMPTY_CHAR}${data}${EMPTY_CHAR.repeat(longestLine - data.replace(/[\u001b]\[\S+?m/g, '').length - 1)}${EMPTY_CHAR}${VERTICAL_SEPARATOR}`);
                break;
            }

            case 'separator': {
                const spacersLength = (longestLine - data.length) / 2;

                logger.log(`${MIDDLE_LEFT_SEPARATOR}${HORIZONTAL_SEPARATOR.repeat(spacersLength)}${EMPTY_CHAR}${data}${EMPTY_CHAR}${HORIZONTAL_SEPARATOR.repeat(spacersLength)}${MIDDLE_RIGHT_SEPARATOR}`);
                break;
            }

            case 'empty-line': {
                logger.log(`${VERTICAL_SEPARATOR}${EMPTY_CHAR.repeat(longestLine + 1)}${VERTICAL_SEPARATOR}`);
                break;
            }

            default: {
                //
            }
            }
        });

        logger.logN(`${BOTTOM_LEFT_SEPARATOR}${HORIZONTAL_SEPARATOR.repeat(longestLine + 1)}${BOTTOM_RIGHT_SEPARATOR}`);
    }
}

module.exports = ConsoleBlock;
