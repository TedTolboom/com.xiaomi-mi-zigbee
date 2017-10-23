'use strict';

const color = require('./color');

/**
 * Map a range of values to a different range of values.
 * @param inputStart
 * @param inputEnd
 * @param outputStart
 * @param outputEnd
 * @param input
 * @returns {number}
 * @memberof Util
 */
function mapValueRange(inputStart, inputEnd, outputStart, outputEnd, input) {
	if (typeof inputStart !== 'number' || typeof inputEnd !== 'number' ||
		typeof outputStart !== 'number' || typeof outputEnd !== 'number' ||
		typeof input !== 'number') {
		return null;
	}
	return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
}

/**
 * Utility class with several color and range conversion methods.
 * @class Util
 */
module.exports = {
	convertRGBToCIE: color.convertRGBToCIE,
	convertHSVToCIE: color.convertHSVToCIE,
	convertHSVToRGB: color.convertHSVToRGB,
	convertRGBToHSV: color.convertRGBToHSV,
	mapValueRange,
};
