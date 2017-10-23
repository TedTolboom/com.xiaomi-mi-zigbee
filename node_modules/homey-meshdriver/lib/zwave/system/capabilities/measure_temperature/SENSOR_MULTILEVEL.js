'use strict';

module.exports = {
	getParser: () => ({
		'Sensor Type': 'Temperature (version 1)',
		Properties1: {
			Scale: 0,
		},
	}),
	report: 'SENSOR_MULTILEVEL_REPORT',
	reportParser: report => {
		if (report &&
			report.hasOwnProperty('Sensor Type') &&
			report['Sensor Type'] === 'Temperature (version 1)' &&
			report.hasOwnProperty('Sensor Value (Parsed)') &&
			report.hasOwnProperty('Level') &&
			report.Level.hasOwnProperty('Scale')) {
			if (report.Level.Scale === 0) return report['Sensor Value (Parsed)'];
			if (report.Level.Scale === 1) return (report['Sensor Value (Parsed)'] - 32) / 1.8;
		}
		return null;
	},
};
