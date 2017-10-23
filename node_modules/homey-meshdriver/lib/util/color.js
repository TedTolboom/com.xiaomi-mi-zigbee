'use strict';

const space = require('color-space');

/**
 * @typedef {Object} RGB
 * @property {number} red - Red value, range 0 - 255.
 * @property {number} green - Green value, range 0 - 255.
 * @property {number} blue - Blue value, range 0 - 255.
 */

/**
 * @typedef {Object} CIE
 * @property {number} x - CIE x (small x) value, range 0 - 0.8 (for ZigBee X multiply by 65279)
 * @property {number} y - CIE y (small y) value, range 0 - 0.9 (for ZigBee Y multiply by 65279)
 */

/**
 * @typedef {Object} HSV
 * @property {number} hue - Hue value, range 0 - 1.
 * @property {number} saturation - Saturation value, range 0 - 1.
 * @property {number} value - Value (brightness) value, range 0 - 1.
 */

/**
 * Method that converts colors from the RGB color space to the CIE (1931) color space (the latter is used by some
 * ZigBee clusters).
 * @param {RGB} - RGB color object
 * @returns {CIE|Error} - CIE color space object
 * @memberof Util
 */
function convertRGBToCIE({ red, green, blue }) {
	if (typeof red !== 'number') red = 0;
	if (typeof green !== 'number') green = 0;
	if (typeof blue !== 'number') blue = 0;

	const result = rgb_to_cie(red, green, blue);
	try {
		const x = Number(result[0]);
		const y = Number(result[1]);
		return { x, y };
	} catch (err) {
		return new Error('failed_to_parse_xy_value_to_number');
	}
}

/**
 * Method that converts colors from the HSV (or HSL) color space to the CIE (1931) color space (the latter is used by
 * some ZigBee clusters).
 * @param {HSV} - HSV color object
 * @returns {CIE} - CIE color space object
 * @memberof Util
 */
function convertHSVToCIE({ hue, saturation, value }) {
	if (typeof hue !== 'number') hue = 1;
	if (typeof saturation !== 'number') saturation = 1;
	if (typeof value !== 'number') value = 1;

	const { red, green, blue } = convertHSVToRGB({ hue, saturation, value });
	return convertRGBToCIE({ red, green, blue });
}

/**
 * Method that converts colors from the HSV (or HSL) color space to the RGB color space.
 * @param {HSV} - HSV color object
 * @returns {RGB} - RGB color object
 * @memberof Util
 */
function convertHSVToRGB({ hue, saturation, value }) {
	if (typeof hue !== 'number') hue = 1;
	if (typeof saturation !== 'number') saturation = 1;
	if (typeof value !== 'number') value = 1;

	const [red, green, blue] = space.hsv.rgb([
		hue * 360,
		saturation * 100,
		value * 100,
	]);
	return { red, green, blue };
}

/**
 * Method that converts colors from the RGB color space to the HSV color space.
 * @param {RGB} - RGB color object
 * @returns {HSV} - HSV color object
 * @memberof Util
 */
function convertRGBToHSV({ red, green, blue }) {
	if (typeof red !== 'number') red = 0;
	if (typeof green !== 'number') green = 0;
	if (typeof blue !== 'number') blue = 0;

	let [hue, saturation, value] = space.rgb.hsv([
		red,
		green,
		blue,
	]);

	// Convert to 0 - 1 range
	hue = hue / 360;
	saturation = saturation / 100;
	value = value / 100;

	return { hue, saturation, value };
}

module.exports = {
	convertRGBToCIE,
	convertHSVToCIE,
	convertHSVToRGB,
	convertRGBToHSV,
};

/*
With these functions you can convert the CIE color space to the RGB color space and vice versa.

The developer documentation for Philips Hue provides the formulas used in the code below:
https://developers.meethue.com/documentation/color-conversions-rgb-xy

I've used the formulas and Objective-C example code and transfered it to JavaScript.


Examples:

var rgb = cie_to_rgb(0.6611, 0.2936)
var cie = rgb_to_cie(255, 39, 60)

------------------------------------------------------------------------------------

The MIT License (MIT)

Copyright (c) 2017 www.usolved.net
Published under https://github.com/usolved/cie-rgb-converter

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * Converts CIE color space to RGB color space
 * @param {Number} x
 * @param {Number} y
 * @param {Number} brightness - Ranges from 1 to 254
 * @return {Array} Array that contains the color values for red, green and blue
 * @ignore
 */
function cie_to_rgb(x, y, brightness) {
	//Set to maximum brightness if no custom value was given (Not the slick ECMAScript 6 way for compatibility reasons)
	if (brightness === undefined) {
		brightness = 254;
	}

	var z = 1.0 - x - y;
	var Y = (brightness / 254).toFixed(2);
	var X = (Y / y) * x;
	var Z = (Y / y) * z;

	//Convert to RGB using Wide RGB D65 conversion
	var red = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
	var green = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
	var blue = X * 0.051713 - Y * 0.121364 + Z * 1.011530;

	//If red, green or blue is larger than 1.0 set it back to the maximum of 1.0
	if (red > blue && red > green && red > 1.0) {

		green = green / red;
		blue = blue / red;
		red = 1.0;
	}
	else if (green > blue && green > red && green > 1.0) {

		red = red / green;
		blue = blue / green;
		green = 1.0;
	}
	else if (blue > red && blue > green && blue > 1.0) {

		red = red / blue;
		green = green / blue;
		blue = 1.0;
	}

	//Reverse gamma correction
	red = red <= 0.0031308 ? 12.92 * red : (1.0 + 0.055) * Math.pow(red, (1.0 / 2.4)) - 0.055;
	green = green <= 0.0031308 ? 12.92 * green : (1.0 + 0.055) * Math.pow(green, (1.0 / 2.4)) - 0.055;
	blue = blue <= 0.0031308 ? 12.92 * blue : (1.0 + 0.055) * Math.pow(blue, (1.0 / 2.4)) - 0.055;


	//Convert normalized decimal to decimal
	red = Math.min(Math.max(Math.round(red * 255), 0), 255);
	green = Math.min(Math.max(Math.round(green * 255), 0), 255);
	blue = Math.min(Math.max(Math.round(blue * 255), 0), 255);

	if (isNaN(red))
		red = 0;

	if (isNaN(green))
		green = 0;

	if (isNaN(blue))
		blue = 0;

	return [red, green, blue];
}


/**
 * Converts RGB color space to CIE color space
 * @param {Number} red
 * @param {Number} green
 * @param {Number} blue
 * @return {Array} Array that contains the CIE color values for x and y
 * @ignore
 */
function rgb_to_cie(red, green, blue) {
	//Apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed on the screen of your device
	var red = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
	var green = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
	var blue = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);

	//RGB values to XYZ using the Wide RGB D65 conversion formula
	var X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
	var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
	var Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;

	//Calculate the xy values from the XYZ values
	var x = (X / (X + Y + Z)).toFixed(4);
	var y = (Y / (X + Y + Z)).toFixed(4);

	if (isNaN(x))
		x = 0;

	if (isNaN(y))
		y = 0;


	return [x, y];
}
