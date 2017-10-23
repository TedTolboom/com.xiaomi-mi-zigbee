'use strict';

const util = require('./../util');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

const maxHue = 254;
const maxSaturation = 254;

class ZigBeeLightDevice extends ZigBeeDevice {

	async onMeshInit() {

		// Register capabilities if present on device
		if (this.hasCapability('onoff')) this.registerCapability('onoff', 'genOnOff');
		if (this.hasCapability('dim')) this.registerCapability('dim', 'genLevelCtrl');

		// Register debounced capabilities
		const groupedCapabilities = [];
		if (this.hasCapability('light_hue')) {
			groupedCapabilities.push({
				capability: 'light_hue',
				cluster: 'lightingColorCtrl',
			});
		}
		if (this.hasCapability('light_saturation')) {
			groupedCapabilities.push({
				capability: 'light_saturation',
				cluster: 'lightingColorCtrl'
			});
		}
		if (this.hasCapability('light_temperature')) {
			this._colorTempMin = this.getStoreValue('colorTempMin');
			this._colorTempMax = this.getStoreValue('colorTempMax');

			if (typeof this._colorTempMin !== 'number') {
				try {
					this._colorTempMin = await this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters['lightingColorCtrl'].read("colorTempPhysicalMin");
					if (typeof this._colorTempMin === 'number') this.setStoreValue('colorTempMin', this._colorTempMin);
					else this.error('retrieved nun-numeric colorTempMin', this._colorTempMin);
				} catch (err) {
					this.error('could not get colorTempMin', err);
				}
			}
			if (typeof this._colorTempMax !== 'number') {
				try {
					this._colorTempMax = await this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters['lightingColorCtrl'].read("colorTempPhysicalMax");
					if (typeof this._colorTempMax === 'number') this.setStoreValue('colorTempMax', this._colorTempMax);
					else this.error('retrieved nun-numeric colorTempMax', this._colorTempMax);
				} catch (err) {
					this.error('could not get colorTempMax', err);
				}
			}

			groupedCapabilities.push({
				capability: 'light_temperature',
				cluster: 'lightingColorCtrl'
			});
		}
		if (this.hasCapability('light_mode')) {
			groupedCapabilities.push({
				capability: 'light_mode',
				cluster: 'lightingColorCtrl'
			});
		}

		// Register multiple capabilities, they will be debounced when one of them is called
		this.registerMultipleCapabilities(groupedCapabilities, (valueObj, optsObj) => {
			this.log('registerMultipleCapabilityListener()', valueObj, optsObj);

			if (valueObj.hasOwnProperty('light_hue') && valueObj.hasOwnProperty('light_saturation')) {

				const lightHue = valueObj.light_hue;
				const lightSaturation = valueObj.light_saturation;

				this.log('registerMultipleCapabilityListener() -> set hue and saturation');

				return this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters['lightingColorCtrl']
					.do("moveToHueAndSaturation", {
						hue: Math.round(lightHue * maxHue),
						saturation: Math.round(lightSaturation * maxSaturation),
						transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0
					})
					.catch(err => {
						throw new Error('failed_to_do_move_to_hue_and_saturation');
					});
			}
			else if (valueObj.hasOwnProperty('light_mode') && valueObj.hasOwnProperty('light_temperature')) {

				this.log('registerMultipleCapabilityListener() -> set mode and temperature');

				return this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters['lightingColorCtrl']
					.do("moveToColorTemp", {
						colortemp: Math.round(util.mapValueRange(0, 1, this._colorTempMin, this._colorTempMax, valueObj.light_temperature)),
						transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
					});
			} else if (valueObj.hasOwnProperty('light_mode') && valueObj.hasOwnProperty('light_hue')) {

				this.log('registerMultipleCapabilityListener() -> set mode and hue');

				return this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters['lightingColorCtrl']
					.do("moveToHue", {
						hue: Math.round(valueObj.light_hue * maxHue),
						direction: 0,
						transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
					});
			}
		});
	}
}


module.exports = ZigBeeLightDevice;