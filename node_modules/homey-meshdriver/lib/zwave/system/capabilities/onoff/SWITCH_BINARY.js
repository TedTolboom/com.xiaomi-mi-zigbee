'use strict';

const util = require('./../../../../util');

const FACTORY_DEFAULT_DIMMING_DURATION = 'Default';

module.exports = {
	get: 'SWITCH_BINARY_GET',
	set: 'SWITCH_BINARY_SET',
	getOpts: {
		getOnStart: true,
	},
	setParserV1: value => ({
		'Switch Value': (value) ? 'on/enable' : 'off/disable',
	}),
	setParserV2(value, options) {
		const duration = (options.hasOwnProperty('duration') ? util.calculateZwaveDimDuration(options.duration) : FACTORY_DEFAULT_DIMMING_DURATION);
		return {
			'Target Value': (value) ? 'on/enable' : 'off/disable',
			'Duration': duration,
		};
	},
	report: 'SWITCH_BINARY_REPORT',
	reportParserV1: report => {
		if (report && report.hasOwnProperty('Value')) {
			if (report.Value === 'on/enable') return true;
			else if (report.Value === 'off/disable') return false;
		}
		return null;
	},
	reportParserV2: report => {
		if (report && report.hasOwnProperty('Current Value')) {
			if (report['Current Value'] === 'on/enable') return true;
			else if (report['Current Value'] === 'off/disable') return false;
		}
		return null;
	},
};
