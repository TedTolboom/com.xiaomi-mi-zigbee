'use strict';

module.exports = {
	get: 'BATTERY_GET',
	getOpts: {
		getOnOnline: true,
	},
	report: 'BATTERY_REPORT',
	reportParser: report => {
		if(report) {
			if (report.hasOwnProperty('Battery Level') && report['Battery Level'] === 'battery low warning') return 1;
			if (report.hasOwnProperty('Battery Level (Raw)')) return report['Battery Level (Raw)'][0];
		}
		return null;
	},
};
