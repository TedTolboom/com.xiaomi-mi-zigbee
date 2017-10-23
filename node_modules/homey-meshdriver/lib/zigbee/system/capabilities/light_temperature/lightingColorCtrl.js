'use strict';

const util = require('./../../../../util');

module.exports = {
	set: 'moveToColorTemp',
	setParser(value) {
		return {
			colortemp: Math.round(util.mapValueRange(0, 1, this._colorTempMin, this._colorTempMax, value)),
			transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
		};
	},
	get: 'colorTemperature',
	reportParser(value) {
		return util.mapValueRange(this._colorTempMin, this._colorTempMax, 0, 1, value);
	},
	report: 'colorTemperature',
	getOpts: {
		getOnStart: true,
	},
};
