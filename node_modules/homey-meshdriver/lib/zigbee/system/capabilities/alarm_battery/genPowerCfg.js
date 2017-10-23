'use strict';

module.exports = {
	get: 'batteryVoltage',
	reportParser(value) {
		/* check if setting bat_thres exists otherwise if batteryThreshold in device.js exist use that.
 		* if both not exist use value 1
		*/
		const batteryThreshold = this.getSetting('batteryThreshold') || this.batteryThreshold || 1;
		// console.log(batThreshold);
		if (value <= batteryThreshold) return true;
		return false;
	},
	report: 'batteryVoltage',
};
