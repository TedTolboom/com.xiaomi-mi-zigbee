'use strict';

module.exports = {
	report: 'BASIC_SET',
	reportParser: report => {
		if (report && report.hasOwnProperty('Value')) {
			return report.Value === 255;
		}
		return null;
	},
};
