'use strict';

module.exports = {
	getParser: () => ({
		'Sensor Type': 'Luminance (version 1)',
		Properties1: {
			Scale: 1,
		},
	}),
	report: 'SENSOR_MULTILEVEL_REPORT',
	reportParser: report => {
		if (report && report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
			if (report['Sensor Type'] === 'Luminance (version 1)') return report['Sensor Value (Parsed)'];
		}
		return null;
	},
};
