'use strict';

module.exports = {
	get: 'NOTIFICATION_GET',
	getParser: () => ({
		'V1 Alarm Type': 0,
		'Notification Type': 'Water',
		Event: 2,
	}),
	report: 'NOTIFICATION_REPORT',
	reportParser: report => {
		if (report['Notification Type'] === 'Water' &&
			report.hasOwnProperty('Event (Parsed)')) {

			if (report['Event (Parsed)'] === 'Water Leak detected' ||
				report['Event (Parsed)'] === 'Water Leak detected, Unknown Location') {
				return true;
			}

			if (report['Event (Parsed)'] === 'Event inactive' &&
				report.hasOwnProperty('Event Parameter') &&
				(report['Event Parameter'][0] === 1 ||
					report['Event Parameter'][0] === 2)) {
				return false;
			}
		}
		return null;
	},
};
