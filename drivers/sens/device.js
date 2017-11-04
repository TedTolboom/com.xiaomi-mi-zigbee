'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class XiaomiTempSensor extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		// this.enableDebug();

		// print the node's info to the console
		// this.printNode();

		const minIntTemp = this.getSetting('minIntTemp') || 60;
		const maxIntTemp = this.getSetting('maxIntTemp') || 3600;
		const repChangeTemp = this.getSetting('repChangeTemp') || 50; // note: 1 = 0.01 [°C]

        // It appears we cannot configure reporting for this device, so just pretend we did so already
        this.configureReportInProcess = true;
        
		// Register the AttributeReportListener
		this.registerAttrReportListener('genBasic', '65281', minIntTemp, maxIntTemp, repChangeTemp,
			this.onTemperatureHumidityReport.bind(this));
	}

	onTemperatureHumidityReport(value) {
	    if(value.length != 31) {
	        this.log('Unknown report');
	    } else {
	        const bytes = new Buffer(value, 'ascii')
	        // this.log('vals', bytes[21], bytes[22], bytes[25], bytes[26])
            
            var tempRaw = (bytes[21] + (bytes[22] << 8));
            if((tempRaw & 0x8000) != 0) tempRaw -= 0x10000;
            const temp = tempRaw / 100.0;
            
            const hum = (bytes[25] + (bytes[26] << 8)) / 100.0;
            this.log('measure_temperature', temp);
            this.log('measure_humidity', hum);
            // this.log('raw', value + " -- " + bytes.toString('hex'));
            this.setCapabilityValue('measure_temperature', temp);
            this.setCapabilityValue('measure_humidity', hum);
	    }
	}
}

module.exports = XiaomiTempSensor;

// WSDCGQ01LM_sens
/*
2017-10-21 00:48:57 [log] [ManagerDrivers] [sens] [0] ------------------------------------------
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] Node: 78db4c1a-5cde-4f65-b68c-42ba2832ca3e
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] - Battery: false
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] - Endpoints: 0
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] -- Clusters:
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- zapp
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genBasic
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genBasic
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- modelId : lumi.sensor_ht
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genIdentify
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genIdentify
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genGroups
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genGroups
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genScenes
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genScenes
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genMultistateInput
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genMultistateInput
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genOta
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genOta
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- manuSpecificCluster
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : manuSpecificCluster
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] - Endpoints: 1
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] -- Clusters:
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- zapp
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genIdentify
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genIdentify
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genGroups
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genGroups
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genScenes
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genScenes
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genMultistateInput
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genMultistateInput
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] - Endpoints: 2
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] -- Clusters:
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- zapp
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genIdentify
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genIdentify
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genGroups
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genGroups
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genScenes
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genScenes
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] --- genAnalogInput
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- cid : genAnalogInput
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ---- sid : attrs
2017-10-21 00:48:58 [log] [ManagerDrivers] [sens] [0] ------------------------------------------
*/
