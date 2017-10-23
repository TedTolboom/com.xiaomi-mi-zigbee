'use strict';

module.exports = {
	get: 'NOTIFICATION_GET',
	getParser: () => ({
		'V1 Alarm Type': 0,
		'Notification Type': 'Heat',
		Event: 2,
	}),
	report: 'NOTIFICATION_REPORT',
	reportParser: report => {
		if (report && report['Notification Type'] === 'Heat' && report.hasOwnProperty('Event (Parsed)')) {

			if (report['Event (Parsed)'] === 'Overheat detected' ||
				report['Event (Parsed)'] === 'Overheat detected, Unknown Location' ||
				report['Event (Parsed)'] === 'Rapid Temperature Rise' ||
				report['Event (Parsed)'] === 'Rapid Temperature Rise, Unknown Location' ||
				report['Event (Parsed)'] === 'Heat Alarm Test') {
				return true;
			}

			if (report['Event (Parsed)'] === 'Event inactive' &&
				report.hasOwnProperty('Event Parameter') &&
				(report['Event Parameter'][0] === 1 ||
					report['Event Parameter'][0] === 2 ||
					report['Event Parameter'][0] === 3 ||
					report['Event Parameter'][0] === 4 ||
					report['Event Parameter'][0] === 7)) {
				return false;
			}
		}
		return null;
	},
};
