'use strict';

module.exports = {
	get: 'SENSOR_ALARM_GET',
	getParser: () => ({
		'Sensor Type': 'General Purpose Alarm',
	}),
	report: 'SENSOR_ALARM_REPORT',
	reportParser: report => {
		if (report &&
			report.hasOwnProperty('Sensor Type') &&
			report['Sensor Type'] === 'General Purpose Alarm' &&
			report.hasOwnProperty('Sensor State')) {
			return report['Sensor State'] === 'alarm';
		}
		return null;
	},
};
