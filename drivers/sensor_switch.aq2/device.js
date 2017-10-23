'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

// WXKG11LM_sensor_switch.aq2
// https://github.com/a4refillpad/Xiaomi/blob/master/devicetypes/a4refillpad/xiaomi-zigbee-button.src/xiaomi-zigbee-button.groovy
// fingerprint profileId: "0104", deviceId: "0104",
// inClusters: "0000, 0003",
// outClusters: "0000(Basic), 0004(Groups), 0003(Identify), 0006(On/Off), 0008(Level Control), 0005(Scenes)",
// manufacturer: "LUMI", model: "lumi.sensor_switch", deviceJoinName: "Xiaomi Button"

/*
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ------------------------------------------
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] Node: 31956e48-9b41-47f5-a9b3-66ca8e09c15c
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] - Battery: false
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] - Endpoints: 0
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] -- Clusters:
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] --- zapp
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] --- genBasic
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- cid : genBasic
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- sid : attrs
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] --- genGroups
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- cid : genGroups
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- sid : attrs
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] --- genOnOff
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- cid : genOnOff
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- sid : attrs
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] --- manuSpecificCluster
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- cid : manuSpecificCluster
2017-10-20 23:44:54 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- sid : attrs
2017-10-20 23:44:56 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ------------------------------------------
*/

class AqaraWirelessSwitch extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();
		// Register onoff capability
		//this.registerCapability('onoff', 'genOnOff', {
		/*
		getOpts: {
			pollInterval: 10000,
		},
		*/
		//}, 0);


		this.registerAttrReportListener('genOnOff', 'onOff', 1, 60, 1, data => {
			this.log('genOnOff - onOff', data, data === 1);
			this.setCapabilityValue('onoff', data === 1);
		}, 0);

		this.registerReportListener('genOnOff', 'onOff', report => {
			this.log(report);
		}, 0);

		// Button (1x) genOnOff OnOff endpoint 1
		// Button (2-3x) genOnOff Unknown endpoint 1 Uint8
		// this.registerReportListener('genOnOff', 'OnOff', report => {
		//	console.log(report);
		//}, 1);

	}
}

module.exports = AqaraWirelessSwitch;
