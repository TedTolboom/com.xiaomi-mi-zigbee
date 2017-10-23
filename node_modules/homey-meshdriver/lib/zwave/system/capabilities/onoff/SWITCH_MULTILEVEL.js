'use strict';

const dimmingDuration = 255; // Factory Default

module.exports = {
	get: 'SWITCH_MULTILEVEL_GET',
	set: 'SWITCH_MULTILEVEL_SET',
	setParser: value => ({
		Value: (value > 0) ? 'on/enable' : 'off/disable',
	}),
	report: 'SWITCH_MULTILEVEL_REPORT',
	reportParserV1: report => {
		if (report) {
			if (report.hasOwnProperty('Value')) {
				if (typeof report.Value === 'number') return report.Value > 0;
				if (typeof report.Value === 'string') return report.Value === 'on/enable';
			}
			if (report.hasOwnProperty('Value (Raw)')) return report['Value (Raw)'][0] > 0;
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
