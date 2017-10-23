'use strict';

module.exports = {
	get: 'measuredValue',
	reportParser(value) {
		return Math.round((value / 100) * 10) / 10;
	},
	report: 'measuredValue',
};
