'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

// sensor_switch
// https://github.com/a4refillpad/Xiaomi/blob/master/devicetypes/a4refillpad/xiaomi-zigbee-button.src/xiaomi-zigbee-button.groovy
// fingerprint profileId: "0104", deviceId: "0104",
// inClusters: "0000, 0003",
// outClusters: "0000(Basic), 0004(Groups), 0003(Identify), 0006(On/Off), 0008(Level Control), 0005(Scenes)",
// manufacturer: "LUMI", model: "lumi.sensor_switch", deviceJoinName: "Xiaomi Button"

class XiaomiWirelessSwitch extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// Button (1x) genOnOff OnOff endpoint 1
		// Button (2-3x) genOnOff Unknown endpoint 1 Uint8
		// this.registerReportListener('genOnOff', 'OnOff', report => {
		//	console.log(report);
		//}, 1);

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

module.exports = XiaomiWirelessSwitch;
