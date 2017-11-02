'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class AqaraWaterSensor extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		/*
		this.registerCapability('alarm_water', 'genOta', {
			report: 'onOff',
			reportParser(value) {
				return value;
			},
		});
		this.registerAttrReportListener('genOnOff', 'onOff', 1, 6000, 1, data => {
			this.log('onOff', data);
			this.setCapabilityValue('alarm_water', data === 1);
		}, 0);*/

	}
}

module.exports = AqaraWaterSensor;

/*
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ------------------------------------------
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] Node: ccdc2a0a-a438-42d3-a3d7-4de0de5e21e4
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] - Battery: false
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] - Endpoints: 0
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] -- Clusters:
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] --- zapp
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] --- genBasic
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- cid : genBasic
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- sid : attrs
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] --- genPowerCfg
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- cid : genPowerCfg
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- sid : attrs
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] --- genIdentify
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- cid : genIdentify
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- sid : attrs
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] --- genOta
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- cid : genOta
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- sid : attrs
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ------------------------------------------
*/
