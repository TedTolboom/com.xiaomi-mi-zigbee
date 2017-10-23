'use strict';

module.exports = {
	report: 'NOTIFICATION_REPORT',
	reportParser(report) {
		if (report && report['Notification Type'] === 'Event' && report.hasOwnProperty('Event (Parsed)')) {
			if (report['Notification Type'] === 'Access Control') {

				// Lock was locked manually, automatically or via external controller
				if (report['Event (Parsed)'] === 'Manual Lock Operation' ||
					report['Event (Parsed)'] === 'RF Lock Operation' ||
					report['Event (Parsed)'] === 'Auto Lock Locked Operation' ||
					report['Event (Parsed)'] === 'Keypad Lock Operation') {
					return true;
				}

				// Lock was unlocked manually or via external controller
				if (report['Event (Parsed)'] === 'Manual Unlock Operation' ||
					report['Event (Parsed)'] === 'RF Unlock Operation' ||
					report['Event (Parsed)'] === 'Keypad Unlock Operation') {
					return false;
				}

				// Lock is jammed, emit event
				if (report['Event (Parsed)'] === 'Lock Jammed') {
					this.emit('lockJammedNotification');
					return false;
				}
			}
		}
		return null;
	},
};
