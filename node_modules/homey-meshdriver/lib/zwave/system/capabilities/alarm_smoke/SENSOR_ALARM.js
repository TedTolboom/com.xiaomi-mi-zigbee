'use strict';

module.exports = {
	get: 'SENSOR_ALARM_GET',
	getParser: () => ({
		'Sensor Type': 'Smoke Alarm',
	}),
	report: 'SENSOR_ALARM_REPORT',
	reportParser: report => {
		if (report &&
			report.hasOwnProperty('Sensor Type') &&
			report['Sensor Type'] === 'Smoke Alarm' &&
			report.hasOwnProperty('Sensor State')) {
			return report['Sensor State'] === 'alarm';
		}
		return null;
	},
};
