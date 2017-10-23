'use strict';

module.exports = {
	report: 'BATTERY_REPORT',
	reportParser: report => {
		if (report && report.hasOwnProperty('Battery Level')) {
			return report['Battery Level'] === 'battery low warning';
		}
	},
};
