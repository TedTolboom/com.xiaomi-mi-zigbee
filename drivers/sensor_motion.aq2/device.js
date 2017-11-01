'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class AqaraHumanBodySensor extends ZigBeeDevice {

	onMeshInit() {

		// Register attribute listener for occupancy
		this.registerAttrReportListener('msOccupancySensing', 'occupancy', 1, 3600, 1,
			this.onOccupancyReport.bind(this));

		// Register attribute listener for illuminance measurements
		this.registerAttrReportListener('msIlluminanceMeasurement', 'measuredValue', 1, 3600, 20,
			this.onIlluminanceReport.bind(this));
	}

	onOccupancyReport(value) {
		this.log('alarm_motion', value === 1);

		// Set and clear motion timeout
		clearTimeout(this.motionTimeout);
		this.motionTimeout = setTimeout(() => {
			this.log('manual alarm_motion reset');
			this.setCapabilityValue('alarm_motion', false);
		}, (this.getSetting('alarm_motion_reset_window') * 1000) || 300);

		// Update capability value
		this.setCapabilityValue('alarm_motion', value === 1);
	}

	onIlluminanceReport(value) {
		this.log('measure_luminance', value);
		this.setCapabilityValue('measure_luminance', value);
	}
}

module.exports = AqaraHumanBodySensor;

// RTCGQ11LM_sensor_motion
// fingerprint profileId: "0104", deviceId: "0104",
// inClusters: "0000, 0003, FFFF, 0019",
// outClusters: "0000, 0004, 0003, 0006, 0008, 0005, 0019",
// manufacturer: "LUMI", model: "lumi.sensor_motion.aq2", deviceJoinName: "Xiaomi Motion"

/*
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ZigBeeDevice has been inited
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ------------------------------------------
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] Node: 52c927a0-98e3-4b1b-8074-2da221c04522
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] - Battery: false
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] - Endpoints: 0
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] -- Clusters:
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] --- zapp
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] --- genBasic
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- cid : genBasic
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- sid : attrs
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- manufacturerName : LUMI
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- modelId : lumi.sensor_motion.aq2
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] --- genOta
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- cid : genOta
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- sid : attrs
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] --- msIlluminanceMeasurement
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- cid : msIlluminanceMeasurement
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- sid : attrs
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] --- msOccupancySensing
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- cid : msOccupancySensing
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- sid : attrs
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] --- manuSpecificCluster
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- cid : manuSpecificCluster
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ---- sid : attrs
2017-09-14 20:29:21 [log] [ManagerDrivers] [aqara_human_body_sensor] [0] ------------------------------------------
*/
