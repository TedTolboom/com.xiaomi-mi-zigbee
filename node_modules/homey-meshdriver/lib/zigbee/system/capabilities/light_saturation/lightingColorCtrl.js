'use strict';

const maxSaturation = 254;

module.exports = {
	set: 'moveToSaturation',
	setParser(value) {
		return {
			saturation: Math.round(value * maxSaturation),
			transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
		};
	},
	get: 'currentSaturation',
	reportParser(value) {
		return value / maxSaturation;
	},
	report: 'currentSaturation',
	getOpts: {
		getOnStart: true,
	},
};
