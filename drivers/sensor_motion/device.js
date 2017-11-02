'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class XiaomiHumanBodySensor extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// Register attribute listener for occupancy
		this.registerAttrReportListener('msOccupancySensing', 'occupancy', 1, 3600, 1,
			this.onOccupancyReport.bind(this));
	}

	onOccupancyReport(value) {
		this.log('alarm_motion', value === 1);

		// Set and clear motion timeout
		clearTimeout(this.motionTimeout);
		this.motionTimeout = setTimeout(() => {
			this.log('manual alarm_motion reset');
			this.setCapabilityValue('alarm_motion', false);
		}, (this.getSetting('alarm_motion_reset_window') || 300) * 1000);

		// Update capability value
		this.setCapabilityValue('alarm_motion', value === 1);
	}
}

module.exports = XiaomiHumanBodySensor;

// RTCGQ01LM_sensor_motion
/*
2017-11-01 20:09:07 [log] [ManagerDrivers] [sensor_motion.aq2] [0] msIlluminanceMeasurement - measuredValue 2 2
2017-11-01 20:09:07 [log] [ManagerDrivers] [sensor_motion.aq2] [0] msOccupancySensing - occupancy true
2017-11-01 20:09:27 [log] [ManagerDrivers] [sensor_motion] [0] ZigBeeDevice has been inited
2017-11-01 20:09:27 [log] [ManagerDrivers] [sensor_motion] [0] ------------------------------------------
2017-11-01 20:09:27 [log] [ManagerDrivers] [sensor_motion] [0] Node: 9e63104b-648b-4dd2-acd7-264775e16e63
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] - Battery: false
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] - Endpoints: 0
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] -- Clusters:
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] --- zapp
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] --- genBasic
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- cid : genBasic
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- sid : attrs
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] --- genIdentify
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- cid : genIdentify
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- sid : attrs
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] --- genGroups
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- cid : genGroups
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- sid : attrs
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] --- genScenes
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- cid : genScenes
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- sid : attrs
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] --- genOnOff
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- cid : genOnOff
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- sid : attrs
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] --- genLevelCtrl
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- cid : genLevelCtrl
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- sid : attrs
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] --- genOta
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- cid : genOta
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- sid : attrs
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] --- manuSpecificCluster
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- cid : manuSpecificCluster
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ---- sid : attrs
2017-11-01 20:09:28 [log] [ManagerDrivers] [sensor_motion] [0] ------------------------------------------
*/
