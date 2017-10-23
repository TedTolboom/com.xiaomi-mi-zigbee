'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

const maxBrightness = 255;

class DimmableBulb extends ZigBeeDevice {
	onMeshInit() {

		// Register onoff capability
		this.registerCapability('onoff', 'genOnOff', {
			set: value => value ? 'on' : 'off',
			setParser: () => ({}),
			get: 'onOff',
			reportParser: value => value === 1,
		});

		// Register dim capability
		this.registerCapability('dim', 'genLevelCtrl', {
			set: 'moveToLevel',
			setParser: value => ({
				level: value * maxBrightness,
				transtime: this.getSetting('transtime'),
			}),
			get: 'currentLevel',
			reportParser: value => value / maxBrightness,
		});

		// Not useful in this case, but using registerReportListener you can subscribe to incoming reports
		this.registerReportListener('genLevelCtrl', 'move', report => {
			console.log(report);
		});

		// Register attr report listener
		this.registerAttrReportListener(
			'genPowerCfg', // Cluster
			'batteryPercentageRemaining', // Attr
			10, // Min report interval in seconds (must be greater than 1)
			60, // Max report interval in seconds (must be zero or greater than 60 and greater than min report interval)
			1, // Report change value, if value changed more than this value send a report
			this.onPowerCfgBatteryPercentageRemainingReport.bind(this)) // Callback with value
				.then(() => {
					// Registering attr reporting succeeded
					this.log('registered attr report listener');
				})
				.catch(err => {
					// Registering attr reporting failed
					this.error('failed to register attr report listener', err);
				});
	}

	onPowerCfgBatteryPercentageRemainingReport(value) {
		this.log('onPowerCfgBatteryPercentageRemainingReport', value);
	}
}

module.exports = DimmableBulb;

