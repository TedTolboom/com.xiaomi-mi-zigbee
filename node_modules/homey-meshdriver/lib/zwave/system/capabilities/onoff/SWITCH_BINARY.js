'use strict';

module.exports = {
	get: 'SWITCH_BINARY_GET',
	set: 'SWITCH_BINARY_SET',
	setParserV1: value => ({
		'Switch Value': (value) ? 'on/enable' : 'off/disable',
	}),
	setParserV2: value => ({
		'Switch Value': (value) ? 'on/enable' : 'off/disable',
		'Duration': 'Default'
	}),
	report: 'SWITCH_BINARY_REPORT',
	reportParser: report => {
		if (report && report.hasOwnProperty('Value')) {
			if (report.Value === 'on/enable') return true;
			else if (report.Value === 'off/disable') return false;
		}
		return null;
	},
};
