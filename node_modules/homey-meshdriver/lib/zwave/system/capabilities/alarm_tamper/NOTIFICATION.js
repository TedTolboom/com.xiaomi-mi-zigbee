'use strict';

module.exports = {
	get: 'NOTIFICATION_GET',
	getParser: () => ({
		'V1 Alarm Type': 0,
		Event: 3,
		'Notification Type': 'Home Security',
	}),
	report: 'NOTIFICATION_REPORT',
	reportParser: report => {
		if (report && report['Notification Type'] === 'Home Security' && report.hasOwnProperty('Event (Parsed)')) {

			if (report['Event (Parsed)'] === 'Tampering, Product covering removed' ||
				report['Event (Parsed)'] === 'Tampering, Invalid Code' ||
				report['Event (Parsed)'] === 'Tampering, Product Moved') {
				return true;
			}

			if (report['Event (Parsed)'] === 'Event inactive' &&
				report.hasOwnProperty('Event Parameter') &&
				(report['Event Parameter'][0] === 3 ||
					report['Event Parameter'][0] === 4 ||
					report['Event Parameter'][0] === 9)) {
				return false;
			}
		}
		return null;
	},
};
