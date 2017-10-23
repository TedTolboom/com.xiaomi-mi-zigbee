'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

// https://github.com/bspranger/Xiaomi/blob/master/devicetypes/a4refillpad/xiaomi-aqara-door-window-sensor.src/xiaomi-aqara-door-window-sensor.groovy
//  fingerprint profileId: "0104", deviceId: "0104",
// inClusters: "0000, 0003",
// outClusters: "0000, 0004",
// manufacturer: "LUMI", model: "lumi.sensor_magnet.aq2", deviceJoinName: "Xiaomi Aqara Door Sensor"

class AqaraWaterSensor extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		this.registerCapability('alarm_water', 'genOnOff', {
			report: 'onOff',
			reportParser(value) {
				return value;
			},
		});
		this.registerAttrReportListener('genOnOff', 'onOff', 1, 6000, 1, data => {
			this.log('onOff', data);
			this.setCapabilityValue('alarm_water', data === 1);
		}, 0);

	}
}

module.exports = AqaraWaterSensor;
