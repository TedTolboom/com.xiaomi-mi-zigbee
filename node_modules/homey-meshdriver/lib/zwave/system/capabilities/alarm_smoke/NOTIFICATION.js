'use strict';

module.exports = {
	get: 'NOTIFICATION_GET',
	getParser: () => ({
		'V1 Alarm Type': 0,
		'Notification Type': 'Smoke',
		Event: 2,
	}),
	report: 'NOTIFICATION_REPORT',
	reportParser: report => {
		if (report && report['Notification Type'] === 'Smoke' && report.hasOwnProperty('Event (Parsed)')) {

			if (report['Event (Parsed)'] === 'Smoke detected' ||
				report['Event (Parsed)'] === 'Smoke detected, Unknown Location' ||
				report['Event (Parsed)'] === 'Smoke Alarm Test') {
				return true;
			}

			if (report['Event (Parsed)'] === 'Event inactive' &&
				report.hasOwnProperty('Event Parameter') &&
				(report['Event Parameter'][0] === 1 ||
					report['Event Parameter'][0] === 2 ||
					report['Event Parameter'][0] === 3)) {
				return false;
			}
		}
		return null;
	},
};
