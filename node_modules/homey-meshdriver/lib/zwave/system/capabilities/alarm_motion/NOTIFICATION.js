'use strict';

module.exports = {
	get: 'NOTIFICATION_GET',
	getParser: () => ({
		'V1 Alarm Type': 0,
		'Notification Type': 'Home Security',
		Event: 8,
	}),
	report: 'NOTIFICATION_REPORT',
	reportParser: report => {
		if (report && report['Notification Type'] === 'Home Security' && report.hasOwnProperty('Event (Parsed)')) {

			if (report['Event (Parsed)'] === 'Motion Detection' ||
				report['Event (Parsed)'] === 'Motion Detection, Unknown Location') {
				return true;
			}

			if (report['Event (Parsed)'] === 'Event inactive' &&
				report.hasOwnProperty('Event Parameter') &&
				(report['Event Parameter'][0] === 7 ||
					report['Event Parameter'][0] === 8)) {
				return false;
			}
		}
		return null;
	},
};
