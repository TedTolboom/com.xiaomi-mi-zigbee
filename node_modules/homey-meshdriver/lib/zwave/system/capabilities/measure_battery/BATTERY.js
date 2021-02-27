'use strict';

/**
 * Capability measure_battery handler for BATTERY command class. It will also update the alarm_battery capability if
 * the device has it.
 */
module.exports = {
	get: 'BATTERY_GET',
	getOpts: {
		// TODO: We should not assume that `getOnOnline` is necessary/safe for all devices
		getOnOnline: true,
	},
	report: 'BATTERY_REPORT',
	reportParser(report) {
		if (report) {
			if (report.hasOwnProperty('Battery Level') && report['Battery Level'] === 'battery low warning') {
				if (this.hasCapability('alarm_battery')) this.setCapabilityValue('alarm_battery', true);
				return 1;
			}
			if (report.hasOwnProperty('Battery Level (Raw)')) {
				if (this.hasCapability('alarm_battery')) this.setCapabilityValue('alarm_battery', false);
				return report['Battery Level (Raw)'][0];
			}
		}
		return null;
	},
};
