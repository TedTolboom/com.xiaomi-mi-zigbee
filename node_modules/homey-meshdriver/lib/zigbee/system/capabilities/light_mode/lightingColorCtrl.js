'use strict';

const util = require('./../../../../util');

const maxHue = 254;
const maxSaturation = 254;

module.exports = {
	set: 'moveToColorTemp',
	setParser(value) {
		switch (value) {
			case 'temperature': {
				return this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters.lightingColorCtrl
					.do('moveToColorTemp', {
						colortemp: Math.round(util.mapValueRange(0, 1, this._colorTempMin, this._colorTempMax,
							this.getCapabilityValue('light_temperature'))),
						transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
					})
					.then(res => {
						this.log('did moveToColorTemp', res);
						return null;
					})
					.catch(err => new Error('failed_to_do_move_to_color_temp', err));
			}
			case 'color': {
				const lightHue = this.getCapabilityValue('light_hue');
				const lightSaturation = this.getCapabilityValue('light_saturation');

				return this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters.lightingColorCtrl
					.do('moveToHueAndSaturation', {
						hue: Math.round(lightHue * maxHue),
						saturation: Math.round(lightSaturation * maxSaturation),
						transtime: this.getSetting('transition_time') ? Math.round(this.getSetting('transition_time') * 10) : 0,
					}).then(() => {
						this.log('did moveToHueAndSaturation');
						return null;
					})
					.catch(err => new Error('failed_to_do_move_to_hue_and_saturation', err));
			}
			default:
				return null;
		}
	},
	get: 'colorMode',
	async reportParser(value) {
		switch (value) {
			case 0:
				return 'color';
			case 1:

				// Get temperature to confirm light mode temperature
				let currentLightTemperature = this.getCapabilityValue('light_temperature');
				if (typeof currentLightTemperature !== 'number') {
					try {
						currentLightTemperature = await this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters.lightingColorCtrl.read('colorTemperature')
					} catch (err) {
						this.error('failed to get light temperature', err);
						currentLightTemperature = null;
					}
				}

				// Probably temperature
				if (currentLightTemperature > 0) return 'temperature';

				// Get hue to confirm light mode color
				let currentHue = this.getCapabilityValue('light_hue');
				if (typeof currentHue !== 'number') {
					try {
						currentHue = await this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters.lightingColorCtrl.read('currentHue')
					} catch (err) {
						this.error('failed to get light hue', err);
						currentHue = null;
					}
				}

				// Probably color
				if (currentHue > 0) return 'color';

				// Still not certain if color, check for saturation
				let currentSaturation = this.getCapabilityValue('light_saturation');
				if (typeof currentSaturation !== 'number') {
					try {
						currentSaturation = await this.node.endpoints[this.getClusterEndpoint('lightingColorCtrl')].clusters.lightingColorCtrl.read('currentSaturation')
					} catch (err) {
						this.error('failed to get light saturation', err);
						currentSaturation = null;
					}
				}

				// Probably color
				if (currentSaturation > 0) return 'color';

				// Could not determine light mode with certainty, assume temperature
				return 'temperature';
			case 2:
				return 'temperature';
			default:
				return null;
		}
	},
	report: 'colorMode',
	getOpts: {
		getOnStart: true,
	},
};
