'use strict';

const dimmingDuration = 255; // Factory Default

module.exports = {
	get: 'SWITCH_MULTILEVEL_GET',
	set: 'SWITCH_MULTILEVEL_SET',
	setParserV1: value => ({
		Value: Math.round(value * 99),
	}),
	setParserV2: value => ({
		Value: Math.round(value * 99),
		'Dimming Duration': dimmingDuration,
	}),
	report: 'SWITCH_MULTILEVEL_REPORT',
	reportParserV1: report => {
		if (report && report.hasOwnProperty('Value (Raw)')) {
			if (report['Value (Raw)'][0] === 255) return 1;
			return report['Value (Raw)'][0] / 99;
		}
		return null;
	},
	reportParserV4: report => {
		if (report && report.hasOwnProperty('Current Value (Raw)')) {
			if (report['Current Value (Raw)'][0] === 255) return 1;
			return report['Current Value (Raw)'][0] / 99;
		}
		return null;
	},
};
