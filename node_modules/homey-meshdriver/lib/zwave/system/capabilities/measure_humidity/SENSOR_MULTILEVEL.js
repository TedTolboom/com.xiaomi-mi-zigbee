'use strict';

module.exports = {
	getParser: () => ({
		'Sensor Type': 'Relative humidity (version 2)',
		Properties1: {
			Scale: 0,
		},
	}),
	report: 'SENSOR_MULTILEVEL_REPORT',
	reportParser: report => {
		if (report && report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
			if (report['Sensor Type'] === 'Relative humidity (version 2)') return report['Sensor Value (Parsed)'];
		}
		return null;
	},
};
