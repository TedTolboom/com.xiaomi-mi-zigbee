'use strict';

const Homey = require('homey');

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

// WSDCGQ01LM_sens
// https://github.com/a4refillpad/Xiaomi/blob/master/devicetypes/a4refillpad/xiaomi-temperature-humidity-sensor.src/xiaomi-temperature-humidity-sensor.groovy
// fingerprint profileId: "0104", deviceId: "0302",
// inClusters: "0000 (Basic),0001(Power Configuration),0003(Identify),0009(Alarms),0402(Temperature Measurement),0405(Relative Humidity Measurement)"

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

class XiaomiTempSensor extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// Temperature Cluster (0x0402)
		this.log('Initializing Temperature (0x0402) Cluster');
		// Min report interval in seconds (must be greater than 1)
		this.minIntTemp = this.getSetting('minIntTemp') || 30;
		// Max report interval in seconds (must be zero or greater than 60 and greater than min report interval)
		this.maxIntTemp = this.getSetting('maxIntTemp') || 120;
		// Report change value, if value changed more than this value send a report
		this.repChangeTemp = this.getSetting('repChangeTemp') || 50; // note: 1 = 0.01 [°C]

		// Register the AttributeReportListener
		this.registerAttrReportListener(
				'msTemperatureMeasurement', // Cluster
				'measuredValue', // Attr
				this.minIntTemp,
				this.maxIntTemp,
				this.repChangeTemp,
				this.onTemperatureReport.bind(this), // Callback with value
				1) // The endpoint index
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener', err);
			});
		this.registerCapability('measure_temperature', 'msTemperatureMeasurement');

		// Humidity Cluster (0x0405)
		this.log('Initializing Humidity (0x0405) Cluster');
		// The minimal reporting interval in seconds (e.g. 10 (seconds)):
		this.minIntHum = this.getSetting('minIntHum') || 60;
		// The maximal reporting interval in seconds (e.g. 300 (seconds))
		this.maxIntHum = this.getSetting('maxIntHum') || 180;
		// Reportable change; the attribute should report its value when the value is changed more than this setting.
		this.repChangeHum = this.getSetting('repChangeHum') || 100; // note: 1 = 0.01 [%]

		// Register the AttributeReportListener
		this.registerAttrReportListener(
				'msRelativeHumidity', // Cluster
				'measuredValue', // Attr
				this.minIntHum,
				this.maxIntHum,
				this.repChangeHum,
				this.onHumidityReport.bind(this), // Callback with value
			) // The endpoint index
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener', err);
			});
		this.registerCapability('measure_humidity', 'msRelativeHumidity');

		this.log('Fully initialized');

	}
	onTemperatureReport(value) {
		let parsedValue = Math.round((value / 100) * 10) / 10;
		this.log('msTemperatureMeasurement - measuredValue', parsedValue);
		this.setCapabilityValue('measure_temperature', parsedValue);
	}

	onHumidityReport(value) {
		let parsedValue = Math.round((value / 100) * 10) / 10;
		this.log('msRelativeHumidity - measuredValue', parsedValue);
		this.setCapabilityValue('measure_humidity', parsedValue);
	}

}

module.exports = XiaomiTempSensor;
