'use strict';

module.exports = {
	get: 'NOTIFICATION_GET',
	getParser: () => ({
		'V1 Alarm Type': 0,
		Event: 23,
		'Notification Type': 'Access Control',
	}),
	report: 'NOTIFICATION_REPORT',
	reportParser: report => {
		if (report && report['Notification Type'] === 'Access Control' && report.hasOwnProperty('Event (Parsed)')) {

			if (report['Event (Parsed)'] === 'Window/Door is open') return true;

			if (report['Event (Parsed)'] === 'Window/Door is closed') return false;

			if (report['Event (Parsed)'] === 'Event inactive' &&
				report.hasOwnProperty('Event Parameter') &&
				report['Event Parameter'][0] === 22) {
				return false;
			}
		}
		return null;
	},
};
