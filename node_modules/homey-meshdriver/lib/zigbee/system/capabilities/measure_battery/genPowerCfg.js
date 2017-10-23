'use strict';

module.exports = {
	get: 'batteryPercentageRemaining',
	reportParser(value) {
		/* max value 200
		* 255 indicates an invalid or unknown reading
		*/
		if (value <= 200 && value !== 255) return Math.round(value / 2);
		return null;
	},
	report: 'batteryPercentageRemaining',
};
