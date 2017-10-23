'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;
//const ZigBeeLightDevice = require('homey-meshdriver').ZigBeeLightDevice;

/*
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ------------------------------------------
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] Node: 1185fec2-4b26-438d-aaa9-7a54ee4486a9
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] - Battery: false
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] - Endpoints: 0
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] -- Clusters:
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- zapp
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genBasic
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genBasic
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genIdentify
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genIdentify
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genGroups
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genGroups
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genScenes
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genScenes
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genMultistateInput
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genMultistateInput
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genOta
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genOta
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- manuSpecificCluster
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : manuSpecificCluster
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] - Endpoints: 1
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] -- Clusters:
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- zapp
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genIdentify
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genIdentify
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genGroups
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genGroups
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genScenes
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genScenes
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genMultistateInput
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genMultistateInput
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] - Endpoints: 2
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] -- Clusters:
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- zapp
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genIdentify
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genIdentify
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genGroups
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genGroups
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genScenes
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genScenes
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] --- genAnalogInput
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- cid : genAnalogInput
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ---- sid : attrs
2017-10-22 23:20:10 [log] [ManagerDrivers] [sensor_86sw2Un] [0] ------------------------------------------
*/

class AqaraLightSwitchDouble extends ZigBeeDevice {

	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		this.registerAttrReportListener('genOnOff', 'onOff', 1, 60, 1, data => {
			this.log('genOnOff - onOff', data === 1);
			this.setCapabilityValue('onoff', data === 1);
		}, 0);

		this.registerReportListener('genOnOff', 'onOff', report => {
			this.log(report);
		}, 0);
	}

}

module.exports = AqaraLightSwitchDouble;
