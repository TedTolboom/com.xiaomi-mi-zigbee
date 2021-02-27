'use strict';

module.exports = {
	get: 'DOOR_LOCK_OPERATION_GET',
	getOpts: {
		// TODO: We should not assume that `getOnOnline` is necessary/safe for all devices
		getOnOnline: true,
	},
	set: 'DOOR_LOCK_OPERATION_SET',
	setParserV2(value) {
		return {
			'Door Lock Mode': (!value) ? 'Door Unsecured' : 'Door Secured',
		};
	},
	report: 'DOOR_LOCK_OPERATION_REPORT',
	reportParserV2(report) {
		if (report && report.hasOwnProperty('Door Lock Mode')) return report['Door Lock Mode'] === 'Door Secured';
		return null;
	},
};
