const os = require('os');
const { request } = require('smol-request');
const logger = require('@scandipwa/scandipwa-dev-utils/logger');
const generateUUID = require('@tilework/mosaic-dev-utils/uuid');
const { getSystemConfigSync } = require('../config/system-config');
const { getExternalIpAddress } = require('./ip');
const pkg = require('../../package.json');

const GA_TRACKING_ID = process.env.GA_TRACKING_ID || 'UA-127741417-8';
const UNKNOWN = 'unknown';

const anonymizeError = (text) => text.replace(new RegExp(`${os.homedir()}`, 'gi'), '/home/magento-scripts-user');

/**
 * Google Analytics Parameters
 * @typedef {Object} GAParameters
 * @property {String} version
 * @property {String} trackingID
 * @property {String} [dataSource]
 * @property {Object} [user]
 * @property {String} [user.clientID]
 * @property {String} [user.userID]
 * @property {Object} [session]
 * @property {String} [session.sessionControl]
 * @property {String} [session.ipOverride]
 * @property {String} [session.userAgentOverride]
 * @property {Object} [systemInfo]
 * @property {String} [systemInfo.userLanguage]
 * @property {Object} [contentInformation]
 * @property {String} [contentInformation.documentLocationUrl]
 * @property {String} [contentInformation.documentPath]
 * @property {String} [contentInformation.documentHostName]
 * @property {Object} [timing]
 * @property {String} [timing.userTimingCategory]
 * @property {String} [timing.userTimingVariableName]
 * @property {String} [timing.userTimingTime]
 * @property {String} [timing.userTimingLabel]
 * @property {Object} [hit]
 * @property {String} [hit.type]
 * @property {Object} [exception]
 * @property {String} [exception.description]
 * @property {Boolean} [exception.fatal]
 * @property {Object} [event]
 * @property {String} event.category
 * @property {String} event.action
 * @property {String} [event.label]
 * @property {String} [event.value]
 * @property {Object} [app]
 * @property {String} [app.name]
 * @property {String} [app.id]
 * @property {String} [app.version]
 * @property {String} [app.installedID]
 * @property {Record<string, string>} [customDimension]
 */

/**
 * @type {GAParameters}
 */
const gaParametersMapping = {
    version: 'v',
    trackingID: 'tid',
    user: {
        clientID: 'cid',
        userID: 'uid'
    },
    session: {
        sessionControl: 'sc',
        ipOverride: 'uip',
        userAgentOverride: 'ua'
    },
    systemInfo: {
        userLanguage: 'ul'
    },
    contentInformation: {
        documentLocationUrl: 'dl',
        documentPath: 'dp',
        documentHostName: 'dh'
    },
    timing: {
        userTimingCategory: 'utc',
        userTimingVariableName: 'utv',
        userTimingTime: 'utt',
        userTimingLabel: 'utl'
    },
    hit: {
        type: 't'
    },
    exception: {
        description: 'exd',
        fatal: 'exf'
    },
    event: {
        category: 'ec',
        action: 'ea',
        label: 'el',
        value: 'ev'
    },
    app: {
        name: 'an',
        id: 'aid',
        version: 'av',
        installedID: 'aiid'
    },
    customDimension: Array.from({ length: 200 }, (_, i) => i + 1).reduce((acc, val) => ({
        ...acc,
        [`customDimension${val}`]: `cd${val}`
    }), {})
};

const getAppData = () => ({
    name: pkg.name,
    version: pkg.version
});

/**
 * @param {GAParameters} parameters
 */
const collectAnalyticsParameters = (parameters) => {
    const parsedParameters = {};

    for (const [firstLevelKey, firstLevelValue] of Object.entries(gaParametersMapping)) {
        if (typeof firstLevelValue === 'object' && firstLevelValue !== null) {
            for (const [secondLevelKey, secondLevelValue] of Object.entries(firstLevelValue)) {
                if (parameters[firstLevelKey] && parameters[firstLevelKey][secondLevelKey]) {
                    parsedParameters[secondLevelValue] = parameters[firstLevelKey][secondLevelKey];
                }
            }
        } else if (parameters[firstLevelKey]) {
            parsedParameters[firstLevelValue] = parameters[firstLevelKey];
        }
    }

    return parsedParameters;
};

class Analytics {
    constructor() {
        this.isGaDisabled = this.getIsGaDisabled();
        this.gaTrackingId = GA_TRACKING_ID;
        this.clientIdentifier = UNKNOWN;
        this.currentUrl = UNKNOWN;
        this.lang = UNKNOWN;

        try {
            this.setClientIdentifier(
                generateUUID()
            );
        } catch (e) {
            this.setClientIdentifier(
                Date.now()
            );
        }
    }

    setLang(lang) {
        this.lang = lang;
    }

    setCurrentUrl(currentUrl) {
        this.currentUrl = currentUrl;
    }

    setClientIdentifier(id) {
        this.clientIdentifier = id;
    }

    setGaTrackingId(id) {
        this.gaTrackingId = id;
    }

    getIsGaDisabled() {
        const { analytics } = getSystemConfigSync({ validate: false });

        return !analytics;
    }

    /**
     * @param {GAParameters} data
     */
    async _collect(data) {
        if (this.isGaDisabled) {
            // skip GA
            return;
        }

        /**
         * @type {GAParameters}
         */
        const analyticsParameters = {
            ...data,
            version: '1',
            trackingID: this.gaTrackingId,
            user: {
                clientID: this.clientIdentifier
            },
            app: getAppData()
        };

        try {
            analyticsParameters.systemInfo = {
                ipOverride: await getExternalIpAddress()
            };
        } catch (e) {
            console.log(e);
            // Do nothing
        }

        if (this.lang !== UNKNOWN) {
            // get system language here
            analyticsParameters.systemInfo = {
                userLanguage: this.lang
            };
        }

        if (this.currentUrl !== UNKNOWN) {
            const {
                hostname,
                pathname
            } = new URL(this.currentUrl);

            analyticsParameters.contentInformation = {
                documentLocationUrl: this.currentUrl,
                documentPath: pathname,
                documentHostName: hostname
            };
        }

        const params = new URLSearchParams(collectAnalyticsParameters(analyticsParameters)).toString();

        try {
            if (!process.env.GA_DEBUG) {
                await request(
                    `https://www.google-analytics.com/collect?${ params }`,
                    {
                        headers: { 'User-Agent': 'Google-Cloud-Functions' },
                        responseType: 'headers'
                    }
                );

                return;
            }

            const { data: jsonResponse } = await request(
                `https://www.google-analytics.com/debug/collect?${ params }`,
                {
                    headers: { 'User-Agent': 'Google-Cloud-Functions' },
                    responseType: 'json'
                }
            );

            logger.log(analyticsParameters);
            logger.log(JSON.stringify(jsonResponse, null, 2));

        // eslint-disable-next-line no-empty
        } catch (e) {
            console.log('Failed to report telemetry data');
        }
    }

    trackError(error, isFatal = true) {
        // return; // nothing
        return this._collect({
            hit: {
                type: 'exception'
            },
            exception: {
                description: anonymizeError(typeof error === 'string' ? error : error.message),
                fatal: isFatal
            }
        });
        // return this._collect({
        //     t: 'exception',
        //     exd: anonymizeError(typeof error === 'string' ? error : error.message),
        //     exf: isFatal
        // });
    }

    trackTiming(label, time, category = UNKNOWN) {
        return this._collect({
            hit: {
                type: 'timing'
            },
            timing: {
                userTimingCategory: category,
                userTimingVariableName: label,
                userTimingLabel: this.currentUrl,
                userTimingTime: Math.round(time)
            }
        });
        // return this._collect({
        //     t: 'timing',
        //     utc: category,
        //     utv: label,
        //     utl: this.currentUrl,
        //     utt: Math.round(time)
        // });
    }

    trackPageView() {
        return this._collect({
            hit: {
                type: 'pageview'
            }
        });
    }

    trackEvent(action, label, value, category = UNKNOWN) {
        return this._collect({
            hit: {
                type: 'event'
            },
            event: {
                category,
                action,
                label,
                value
            }
        });
        // return this._collect({
        //     t: 'event',
        //     ec: category,
        //     ea: action,
        //     el: label,
        //     ev: value
        // });
    }

    printAboutAnalytics() {
        if (!this.isGaDisabled) {
            logger.log('We collect analytics data to make our products more stable and reliable!');
            logger.log('If you want to know more go here https://docs.scandipwa.com/about/data-analytics');
            logger.logN();
        }
    }
}

module.exports = new Analytics();
