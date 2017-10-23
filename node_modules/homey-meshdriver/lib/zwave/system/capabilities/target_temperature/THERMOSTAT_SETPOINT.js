'use strict';

module.exports = {
	get: 'THERMOSTAT_SETPOINT_GET',
	getParser: ({
		Level: {
			'Setpoint Type': 'Heating 1',
		},
	}),
	set: 'THERMOSTAT_SETPOINT_SET',
	setParser: value => {

		// Create value buffer
		const bufferValue = new Buffer(2);
		bufferValue.writeUInt16BE((Math.round(value * 2) / 2 * 10).toFixed(0));

		return {
			Level: {
				'Setpoint Type': 'Heating 1',
			},
			Level2: {
				Size: 2,
				Scale: 0,
				Precision: 1,
			},
			Value: bufferValue,
		};
	},
	report: 'THERMOSTAT_SETPOINT_REPORT',
	reportParser: report => {
		if (report && report.hasOwnProperty('Level2')
			&& report.Level2.hasOwnProperty('Scale')
			&& report.Level2.hasOwnProperty('Precision')
			&& report.Level2.Scale === 0
			&& typeof report.Level2.Size !== 'undefined') {

			let readValue;
			try {
				readValue = report.Value.readUIntBE(0, report.Level2.Size);
			} catch (err) {
				return null;
			}

			if (typeof readValue !== 'undefined') {
				return readValue / Math.pow(10, report.Level2.Precision);
			}
			return null;
		}
		return null;
	},
};
