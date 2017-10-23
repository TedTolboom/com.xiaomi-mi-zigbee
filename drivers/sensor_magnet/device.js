'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

// MCCGQ01LM_sensor_magnet
// https://github.com/a4refillpad/Xiaomi/blob/master/devicetypes/a4refillpad/xiaomi-door-window-sensor.src/xiaomi-door-window-sensor.groovy
// fingerprint profileId: "0104", deviceId: "0104",
// inClusters: "0000(Basic), 0003(Identify)",
// outClusters: "0000(Basic), 0004(Groups), 0003(Identify), 0006(On/Off), 0008(Level Control), 0005(Scenes)",
// manufacturer: "LUMI", model: "lumi.sensor_magnet", deviceJoinName: "Xiaomi Door Sensor"

/*
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] Node: 2a3902d3-988a-4ae5-adea-6e0d7c85ec5e
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] - Battery: false
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] - Endpoints: 0
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] -- Clusters:
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] --- zapp
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] --- genBasic
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- cid : genBasic
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- sid : attrs
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] --- genIdentify
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- cid : genIdentify
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- sid : attrs
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] --- genGroups
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- cid : genGroups
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- sid : attrs
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] --- genScenes
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- cid : genScenes
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- sid : attrs
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] --- genOnOff
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- cid : genOnOff
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- sid : attrs
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] --- genLevelCtrl
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- cid : genLevelCtrl
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- sid : attrs
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] --- genOta
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- cid : genOta
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- sid : attrs
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] --- manuSpecificCluster
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- cid : manuSpecificCluster
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ---- sid : attrs
2017-10-21 00:55:34 [log] [ManagerDrivers] [sensor_magnet] [0] ------------------------------------------
*/

class XiaomiDoorWindowSensor extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// DWS genOnOff OnOff endpoint 1
		//this.registerReportListener('genOnOff', 'OnOff', report => {
		//	console.log(report);
		//}, 1);

		this.registerCapability('alarm_contact', 'genOnOff', {
			report: 'onOff',
			reportParser(value) {
				return value === 1;
			},
		}, 0);

		this.registerAttrReportListener('genOnOff', 'onOff', 1, 60, 1, data => {
			this.log('genOnOff - onOff', data === 1);
			this.setCapabilityValue('alarm_contact', data === 1);
		}, 0);

		this.registerReportListener('genOnOff', 'onOff', report => {
			this.log(report);
		}, 0);
	}
}

module.exports = XiaomiDoorWindowSensor;
