'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

// sensor_switch
// https://github.com/a4refillpad/Xiaomi/blob/master/devicetypes/a4refillpad/xiaomi-zigbee-button.src/xiaomi-zigbee-button.groovy
// fingerprint profileId: "0104", deviceId: "0104",
// inClusters: "0000, 0003",
// outClusters: "0000(Basic), 0004(Groups), 0003(Identify), 0006(On/Off), 0008(Level Control), 0005(Scenes)",
// manufacturer: "LUMI", model: "lumi.sensor_switch", deviceJoinName: "Xiaomi Button"

/*
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ZigBeeDevice has been inited
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ------------------------------------------
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] Node: 8dd56393-7c25-4191-bc4d-7b87d44ae5fb
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] - Battery: false
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] - Endpoints: 0
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] -- Clusters:
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- zapp
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genBasic
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genBasic
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- modelId : lumi.sensor_switch
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genIdentify
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genIdentify
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genGroups
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genGroups
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genScenes
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genScenes
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genOnOff
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genOnOff
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- onOff : 1
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genLevelCtrl
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genLevelCtrl
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genOta
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genOta
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- manuSpecificCluster
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : manuSpecificCluster
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ------------------------------------------
*/

class XiaomiWirelessSwitch extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// Register onoff capability
		// Button (1x) genOnOff OnOff endpoint 1
		this.registerCapability('onoff', 'genOnOff', {
			set: value => value ? 'on' : 'off',
			setParser: () => ({}),
			get: 'onOff',
			reportParser: value => {
				this.log(value);
				return value === 1;
			},
		}, 0);

		this.registerAttrReportListener('genOnOff', 'onOff', 1, 60, 1, data => {
			this.log('genOnOff - onOff', data, data === 1);
			this.setCapabilityValue('button', data === 1);
		}, 0);

		this.registerReportListener('genOnOff', 'onOff', report => {
			this.log(report);
		}, 0);

		// scenes
		// Button (2-3x) genOnOff Unknown endpoint 1 Uint8
		this.registerAttrReportListener('genOnOff', 'Uint8', 1, 60, 1, data => {
			this.log('genOnOff - Uint8', data);
		}, 0);
	}
}

module.exports = XiaomiWirelessSwitch;
