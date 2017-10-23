'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

// RTCGQ01LM_sensor_motion
// fingerprint profileId: "0104", deviceId: "0104",
// inClusters: "0000(Basic), 0003(Identify), FFFF, 0019(OTA Upgrade cluster)",
// outClusters: "0000(Basic), 0004(Groups), 0003(Identify), 0006(On/Off), 0008(Level Control), 0005(Scenes), 0019(OTA Upgrade cluster)",
// manufacturer: "LUMI", model: "lumi.sensor_motion", deviceJoinName: "Xiaomi Motion"

class XiaomiHumanBodySensor extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();
		// alarm_motion
		this.registerCapability('alarm_motion', 'msOccupancySensing', {
			report: 'occupancy',
			reportParser(value) {
				return value;
			},
		});
		this.registerAttrReportListener('msOccupancySensing', 'occupancy', 1, 6000, null, data => {
			this.log('occupancy', data);
		}, 0);
		// Not useful in this case, but using registerReportListener you can subscribe to incoming reports
		// this.registerReportListener('msOccupancySensing', 'occupancy', report => {
		// 	console.log(report);
		// },1);

		if (this.node) {

			// Listen to all the commands that come in
			this.node.on('command', report => {
				console.log('Command received');
				console.log(report);
				console.log(report.endpoint);
				console.log(report.attr);
				console.log(report.value);
			});
		}
	}
}

module.exports = XiaomiHumanBodySensor;
