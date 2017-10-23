'use strict';

module.exports = {
	get: 'SENSOR_BINARY_GET',
	getParser: () => ({
		'Sensor Type': 'Door/Window',
	}),
	report: 'SENSOR_BINARY_REPORT',
	reportParserV1: report => {
		if (report && report.hasOwnProperty('Sensor Value')) {
			return report['Sensor Value'] === 'detected an event';
		}
		return null;
	},
	reportParserV2: report => {
		if (report &&
			report.hasOwnProperty('Sensor Value') &&
			report.hasOwnProperty('Sensor Type') &&
			report['Sensor Type'] === 'Door/Window') {
			return report['Sensor Value'] === 'detected an event';
		}
		return null;
	},
};
