'use strict';

module.exports = {
	get: 'measuredValue',
	reportParser(value) {
		return Math.round(Math.pow(10, (value - 1) / 10000));
	},
	report: 'measuredValue',
};
