'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

const util = require('../util');

const CIEMultiplier = 65279;

class ZigBeeXYLightDevice extends ZigBeeDevice {

	onMeshInit() {

		this.printNode();

		// Register capabilities if present on device
		if (this.hasCapability('onoff')) this.registerCapability('onoff', 'genOnOff');
		if (this.hasCapability('dim')) this.registerCapability('dim', 'genLevelCtrl');

		// Register debounced capabilities
		const groupedCapabilities = [];
		if (this.hasCapability('light_hue')) {
			groupedCapabilities.push({
				capability: 'light_hue',
				cluster: 'lightingColorCtrl',
				opts: {
					set: 'moveToColor',
					setParser(value) {
						const { x, y } = util.convertHSVToCIE({
							hue: value,
							saturation: this.getCapabilityValue('light_saturation'),
							value: this.getCapabilityValue('dim'),
						});
						return {
							colorx: x * CIEMultiplier,
							colory: y * CIEMultiplier,
							transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
						};
					},
				},
			});
		}
		if (this.hasCapability('light_saturation')) {
			groupedCapabilities.push({
				capability: 'light_saturation',
				cluster: 'lightingColorCtrl',
				opts: {
					set: 'moveToColor',
					setParser(value) {
						const { x, y } = util.convertHSVToCIE({
							hue: this.getCapabilityValue('light_hue'),
							saturation: value,
							value: this.getCapabilityValue('dim'),
						});
						return {
							colorx: x * CIEMultiplier,
							colory: y * CIEMultiplier,
							transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
						};
					},
				},
			});
		}
		if (this.hasCapability('light_temperature')) {
			groupedCapabilities.push({
				capability: 'light_temperature',
				cluster: 'lightingColorCtrl',
				opts: {
					set: 'moveToColor',
					setParser(value) {

						// Correct a bit for a nice temperature curve
						const temperature = 0.2 + value / 4;
						return {
							colorx: temperature * CIEMultiplier,
							colory: temperature * CIEMultiplier,
							transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
						};
					},
				},
			});
		}
		if (this.hasCapability('light_mode')) {
			groupedCapabilities.push({
				capability: 'light_mode',
				cluster: 'lightingColorCtrl',
				opts: {
					set: 'moveToColor',
					setParser(value) {

						// Set color
						if (value === 'color') {
							const { x, y } = util.convertHSVToCIE({
								hue: this.getCapabilityValue('light_hue'),
								saturation: this.getCapabilityValue('light_saturation'),
								value: this.getCapabilityValue('dim'),
							});
							return {
								colorx: x * CIEMultiplier,
								colory: y * CIEMultiplier,
								transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
							};
						}

						// Set light temperature
						const temperature = 0.2 + this.getCapabilityValue('light_temperature') / 4;
						return {
							colorx: temperature * CIEMultiplier,
							colory: temperature * CIEMultiplier,
							transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
						};
					},
				},
			});
		}

		// Register multiple capabilities, they will be debounced when one of them is called
		this.registerMultipleCapabilities(groupedCapabilities, (valueObj, optsObj) => {
			this.log('registerMultipleCapabilityListener()', valueObj, optsObj);

			if (valueObj.hasOwnProperty('light_hue') && valueObj.hasOwnProperty('light_saturation')) {

				const lightHue = valueObj.light_hue;
				const lightSaturation = valueObj.light_saturation;

				this.log('registerMultipleCapabilityListener() -> set hue and saturation');
				const { x, y } = util.convertHSVToCIE({
					hue: lightHue,
					saturation: lightSaturation,
					value: this.getCapabilityValue('dim'),
				});

				return this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters['lightingColorCtrl']
					.do('moveToColor', {
						colorx: x * CIEMultiplier,
						colory: y * CIEMultiplier,
						transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
					})
					.catch(() => {
						throw new Error('failed_to_do_move_to_hue_and_saturation');
					});
			}
			else if (valueObj.hasOwnProperty('light_mode') && valueObj.hasOwnProperty('light_temperature')) {

				const lightTemperature = valueObj.light_temperature;

				this.log('registerMultipleCapabilityListener() -> set mode and temperature');

				return this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters['lightingColorCtrl']
					.do('moveToColor', {
						colorx: lightTemperature * CIEMultiplier,
						colory: lightTemperature * CIEMultiplier,
						transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
					});
			} else if (valueObj.hasOwnProperty('light_mode') && valueObj.hasOwnProperty('light_hue')) {

				const lightHue = valueObj.light_hue;

				this.log('registerMultipleCapabilityListener() -> set mode and hue');

				const { x, y } = util.convertHSVToCIE({
					hue: lightHue,
					saturation: this.getCapabilityValue('light_saturation'),
					value: this.getCapabilityValue('dim'),
				});

				return this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters['lightingColorCtrl']
					.do('moveToColor', {
						colorx: x * CIEMultiplier,
						colory: y * CIEMultiplier,
						transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
					});
			}
		});
	}
}

module.exports = ZigBeeXYLightDevice;
