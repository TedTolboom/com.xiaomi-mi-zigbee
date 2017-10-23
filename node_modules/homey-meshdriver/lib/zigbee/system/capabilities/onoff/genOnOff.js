'use strict';

module.exports = {
	set: value => value ? 'on' : 'off',
	setParser: () => ({}),
	get: 'onOff',
	reportParser(value) {
		return value === 1;
	},
	report: 'onOff',
	getOpts: {
		getOnStart: true,
	},
};
