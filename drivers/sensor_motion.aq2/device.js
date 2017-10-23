'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

// RTCGQ11LM_sensor_motion
// fingerprint profileId: "0104", deviceId: "0104",
// inClusters: "0000, 0003, FFFF, 0019",
// outClusters: "0000, 0004, 0003, 0006, 0008, 0005, 0019",
// manufacturer: "LUMI", model: "lumi.sensor_motion.aq2", deviceJoinName: "Xiaomi Motion"

/*
2017-10-20 23:14:47 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ZigBeeDevice has been inited
2017-10-20 23:14:47 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ------------------------------------------
2017-10-20 23:14:47 [log] [ManagerDrivers] [sensor_motion.aq2] [0] Node: 363f731f-57fe-4a43-96fe-0513ae78a907
2017-10-20 23:14:47 [log] [ManagerDrivers] [sensor_motion.aq2] [0] - Battery: false
2017-10-20 23:14:47 [log] [ManagerDrivers] [sensor_motion.aq2] [0] - Endpoints: 0
2017-10-20 23:14:47 [log] [ManagerDrivers] [sensor_motion.aq2] [0] -- Clusters:
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] --- zapp
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] --- genBasic
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ---- cid : genBasic
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ---- sid : attrs
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] --- genOta
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ---- cid : genOta
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ---- sid : attrs
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] --- msIlluminanceMeasurement
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ---- cid : msIlluminanceMeasurement
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ---- sid : attrs
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] --- msOccupancySensing
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ---- cid : msOccupancySensing
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ---- sid : attrs
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] --- manuSpecificCluster
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ---- cid : manuSpecificCluster
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ---- sid : attrs
2017-10-20 23:14:48 [log] [ManagerDrivers] [sensor_motion.aq2] [0] ------------------------------------------
*/

class AqaraHumanBodySensor extends ZigBeeDevice {
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
				'occupancy', // Attr
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

		// Illuminance Cluster
		// Occupancy Cluster
		this.log('Initializing Illuminance Cluster');
		// The minimal reporting interval in seconds (e.g. 10 (seconds)):
		this.minIntLum = this.getSetting('minIntLum') || 1;
		// The maximal reporting interval in seconds (e.g. 300 (seconds))
		this.maxIntLum = this.getSetting('maxIntLum') || 3000; // 3000 = 300 seconds
		// The maximal reporting interval in seconds (e.g. 300 (seconds))
		this.repChangeLum = this.getSetting('repChangeLum') || 10;

		// Register the AttributeReportListener
		this.registerAttrReportListener(
				'msIlluminanceMeasurement', // Cluster
				'measuredValue', // Attr
				this.minIntMot,
				this.maxIntMot,
				this.repChangeLum,
				this.onLuminanceReport.bind(this), // Callback with value
				0) // The endpoint index
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener', err);
			});

	}
	onMotionReport(value) {
		this.log('msOccupancySensing - occupancy', value === 1);
		this.setCapabilityValue('alarm_motion', value === 1);
	}
	onLuminanceReport(value) {
		const luminanceValue = value; //Math.round(Math.pow(10, (value - 1) / 10000));
		this.log('msIlluminanceMeasurement - measuredValue', value, luminanceValue);
		this.setCapabilityValue('measure_luminance', luminanceValue);
	}
}

module.exports = AqaraHumanBodySensor;
