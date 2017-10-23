'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

// MCCGQ11LM_sensor_magnet
// https://github.com/bspranger/Xiaomi/blob/master/devicetypes/a4refillpad/xiaomi-aqara-door-window-sensor.src/xiaomi-aqara-door-window-sensor.groovy
//  fingerprint profileId: "0104", deviceId: "0104",
// inClusters: "0000, 0003",
// outClusters: "0000, 0004",
// manufacturer: "LUMI", model: "lumi.sensor_magnet.aq2", deviceJoinName: "Xiaomi Aqara Door Sensor"
/*
2017-10-20 23:59:01 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ------------------------------------------
2017-10-20 23:59:01 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] Node: 838816d1-66b1-4a2e-a9da-b4758ae6f2db
2017-10-20 23:59:01 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] - Battery: false
2017-10-20 23:59:01 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] - Endpoints: 0
2017-10-20 23:59:01 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] -- Clusters:
2017-10-20 23:59:01 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] --- zapp
2017-10-20 23:59:01 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] --- genBasic
2017-10-20 23:59:01 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ---- cid : genBasic
2017-10-20 23:59:01 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ---- sid : attrs
2017-10-20 23:59:02 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] --- genIdentify
2017-10-20 23:59:02 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ---- cid : genIdentify
2017-10-20 23:59:02 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ---- sid : attrs
2017-10-20 23:59:02 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] --- genGroups
2017-10-20 23:59:03 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ---- cid : genGroups
2017-10-20 23:59:03 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ---- sid : attrs
2017-10-20 23:59:03 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] --- genOnOff
2017-10-20 23:59:03 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ---- cid : genOnOff
2017-10-20 23:59:03 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ---- sid : attrs
2017-10-20 23:59:03 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] --- manuSpecificCluster
2017-10-20 23:59:03 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ---- cid : manuSpecificCluster
2017-10-20 23:59:03 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ---- sid : attrs
2017-10-20 23:59:03 [log] [ManagerDrivers] [sensor_magnet.aq2] [0] ------------------------------------------
*/

class AqaraDoorWindowSensor extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

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
	}
}

module.exports = AqaraDoorWindowSensor;
