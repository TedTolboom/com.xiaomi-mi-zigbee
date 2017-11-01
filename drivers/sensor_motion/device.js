'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

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


class XiaomiHumanBodySensor extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// Occupancy Cluster
		// Register alarm_motion capability
		this.log('Initializing Occupancy (0x0401) Cluster');
		// The minimal reporting interval in seconds (e.g. 10 (seconds)):
		this.minIntMot = this.getSetting('minIntMot') || 1;
		// The maximal reporting interval in seconds (e.g. 300 (seconds))
		this.maxIntMot = this.getSetting('maxIntMot') || 600; // 600 = 60 seconds

		// The maximal reporting interval in seconds (e.g. 300 (seconds))
		this.IntCanMot = this.getSetting('IntCanMot') || 60;

		// Register the AttributeReportListener
		this.registerAttrReportListener(
				'msOccupancySensing', // Cluster
				'0x0000', // Attr
				this.minIntMot,
				this.maxIntMot,
				1,
				this.onMotionReport.bind(this), // Callback with value
				0) // The endpoint index
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener', err);
			});
		// Not useful in this case, but using registerReportListener you can subscribe to incoming reports
		this.registerReportListener('msOccupancySensing', 'occupancy', report => {
			console.log('reportListener', report);
		});

	}
	onMotionReport(value) {
		this.log('msOccupancySensing - occupancy', value === 1);
		this.setCapabilityValue('alarm_motion', value === 1);

	}

}

module.exports = XiaomiHumanBodySensor;
