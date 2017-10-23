'use strict';

module.exports = {
	get: 'BASIC_GET',
	set: 'BASIC_SET',
	setParser: value => ({
		'Value': (value) ? 255 : 0,
	}),
	report: 'BASIC_REPORT',
	reportParser(report) {
		if (report && report.hasOwnProperty('Value')) return report.Value === 255;
		return null;
	},
};
