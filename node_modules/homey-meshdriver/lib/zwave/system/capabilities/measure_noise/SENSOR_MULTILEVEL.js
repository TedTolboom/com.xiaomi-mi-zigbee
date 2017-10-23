'use strict';

module.exports = {
	getParser: () => ({
		'Sensor Type': 'Loudness (v5)',
		Properties1: {
			Scale: 0,
		},
	}),
	report: 'SENSOR_MULTILEVEL_REPORT',
	reportParser: report => {
		if (report && report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
			if (report['Sensor Type'] === 'Loudness (v5)') return report['Sensor Value (Parsed)'];
		}
		return null;
	},
};
