'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class AqaraDoorWindowSensor extends ZigBeeDevice {
	onMeshInit() {

		// Listen for attribute changes on the genOnOff cluster
		this.registerAttrReportListener('genOnOff', 'onOff', 1, 3600, 1, data => {
			this.log(`alarm_contact -> ${data === 1}`);
			this.setCapabilityValue('alarm_contact', data === 1);
		});
	}
}

module.exports = AqaraDoorWindowSensor;

// MCCGQ11LM_sensor_magnet
/*
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ------------------------------------------
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] Node: e827ed2c-c8ec-4cba-9072-97131017da00
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] - Battery: false
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] - Endpoints: 0
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] -- Clusters:
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] --- zapp
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] --- genBasic
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ---- cid : genBasic
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ---- sid : attrs
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] --- genIdentify
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ---- cid : genIdentify
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ---- sid : attrs
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] --- genGroups
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ---- cid : genGroups
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ---- sid : attrs
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] --- genOnOff
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ---- cid : genOnOff
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ---- sid : attrs
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] --- manuSpecificCluster
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ---- cid : manuSpecificCluster
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ---- sid : attrs
2017-09-14 20:48:16 [log] [ManagerDrivers] [aqara_door_window_sensor] [0] ------------------------------------------
*/
