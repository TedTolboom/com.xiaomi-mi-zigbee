'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class AqaraWeatherSensor extends ZigBeeDevice {
	onMeshInit() {

		const minIntTemp = this.getSetting('minIntTemp') || 60;
		const maxIntTemp = this.getSetting('maxIntTemp') || 3600;
		const repChangeTemp = this.getSetting('repChangeTemp') || 50; // note: 1 = 0.01 [°C]

		// Register the AttributeReportListener
		this.registerAttrReportListener('msTemperatureMeasurement', 'measuredValue', minIntTemp, maxIntTemp, repChangeTemp,
			this.onTemperatureReport.bind(this));

		const minIntHum = this.getSetting('minIntHum') || 60;
		const maxIntHum = this.getSetting('maxIntHum') || 3600;
		const repChangeHum = this.getSetting('repChangeHum') || 100; // note: 1 = 0.01 [%]

		// Register the AttributeReportListener
		this.registerAttrReportListener('msRelativeHumidity', 'measuredValue', minIntHum, maxIntHum, repChangeHum,
			this.onHumidityReport.bind(this));

		const minIntPres = this.getSetting('minIntPres') || 60;
		const maxIntPres = this.getSetting('maxIntPres') || 3600;
		const repChangePres = this.getSetting('repChangePres') || 100; // note: 1 = 0.01 [%]

		// Register the AttributeReportListener
		this.registerAttrReportListener('msPressureMeasurement', '16', minIntPres, maxIntPres, repChangePres,
			this.onPressureReport.bind(this));
	}

	onTemperatureReport(value) {
		const parsedValue = Math.round((value / 100) * 10) / 10;
		this.log('measure_temperature', parsedValue);
		this.setCapabilityValue('measure_temperature', parsedValue);
	}

	onHumidityReport(value) {
		const parsedValue = Math.round((value / 100) * 10) / 10;
		this.log('measure_humidity', parsedValue);
		this.setCapabilityValue('measure_humidity', parsedValue);
	}

	onPressureReport(value) {
		const parsedValue = Math.round((value / 100) * 10);
		this.log('measure_pressure', parsedValue);
		this.setCapabilityValue('measure_pressure', parsedValue);
	}
}

module.exports = AqaraWeatherSensor;

// WSDCGQ11LM_weather

/*
2017-09-09 18:54:06 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] - Battery: false
2017-09-09 18:54:06 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] - Endpoints: 0
2017-09-09 18:54:06 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] -- Clusters:
2017-09-09 18:54:06 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] --- zapp
2017-09-09 18:54:06 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] --- genBasic
2017-09-09 18:54:06 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- cid : genBasic
2017-09-09 18:54:06 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- sid : attrs
2017-09-09 18:54:06 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] --- genIdentify
2017-09-09 18:54:06 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- cid : genIdentify
2017-09-09 18:54:06 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- sid : attrs
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] --- genGroups
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- cid : genGroups
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- sid : attrs
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] --- msTemperatureMeasurement
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- cid : msTemperatureMeasurement
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- sid : attrs
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] --- msPressureMeasurement
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- cid : msPressureMeasurement
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- sid : attrs
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] --- msRelativeHumidity
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- cid : msRelativeHumidity
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- sid : attrs
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] --- manuSpecificCluster
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- cid : manuSpecificCluster
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ---- sid : attrs
2017-09-09 18:54:07 [log] [ManagerDrivers] [temperature_humidity_pressure_sensor] [0] ------------------------------------------
*/
