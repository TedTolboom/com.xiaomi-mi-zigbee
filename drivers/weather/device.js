'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class AqaraWeatherSensor extends ZigBeeDevice {
	onMeshInit() {

		// enable debugging
		// this.enableDebug();

		// print the node's info to the console
		// this.printNode();

		const minIntTemp = this.getSetting('minIntTemp') || 60;
		const maxIntTemp = this.getSetting('maxIntTemp') || 0;
		const repChangeTemp = this.getSetting('repChangeTemp') || 1; // note: 1 = 0.01 [°C]

		// Register the AttributeReportListener
		this.registerAttrReportListener('msTemperatureMeasurement', 'measuredValue', minIntTemp, maxIntTemp, repChangeTemp,
				this.onTemperatureReport.bind(this), 0)
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener - msTemperatureMeasurement');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener - msTemperatureMeasurement', err);
			});


		const minIntHum = this.getSetting('minIntHum') || 60;
		const maxIntHum = this.getSetting('maxIntHum') || 0;
		const repChangeHum = this.getSetting('repChangeHum') || 1; // note: 1 = 0.01 [%]

		// Register the AttributeReportListener
		this.registerAttrReportListener('msRelativeHumidity', 'measuredValue', minIntHum, maxIntHum, repChangeHum,
				this.onHumidityReport.bind(this), 0)
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener - msRelativeHumidity');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener - msRelativeHumidity', err);
			});

		const minIntPres = this.getSetting('minIntPres') || 60;
		const maxIntPres = this.getSetting('maxIntPres') || 0;
		const repChangePres = this.getSetting('repChangePres') || 1; // note: 1 = 0.01 [%]

		// Register the AttributeReportListener
		this.registerAttrReportListener('msPressureMeasurement', '16', minIntPres, maxIntPres, repChangePres,
				this.onPressureReport.bind(this), 0)
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener - msPressureMeasurement');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener - msPressureMeasurement', err);
			});

		// Register the AttributeReportListener - Lifeline
		this.registerAttrReportListener('genBasic', '65281', 1, 60, null,
				this.onLifelineReport.bind(this), 0)
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener - genBasic - Lifeline');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener - genBasic - Lifeline', err);
			});
	}

	onTemperatureReport(value) {
		const parsedValue = Math.round((value / 100) * 10) / 10;
		const temperatureOffset = this.getSetting('temperature_offset') || 0;
		this.log('measure_temperature', parsedValue, '+ temperature offset', temperatureOffset);
		this.setCapabilityValue('measure_temperature', parsedValue + temperatureOffset);
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

	onLifelineReport(value) {
		this.log('lifeline report', new Buffer(value, 'ascii'));
		/*
		const parsedData = parseData(new Buffer(value, 'ascii'));
		this.log('parsedData', parsedData);

		// battery reportParser (ID 1)
		const parsedVolts = parsedData['1'] / 100.0;
		const minVolts = 2.5;
		const maxVolts = 3.0;

		const parsedBatPct = Math.min(100, Math.round((parsedVolts - minVolts) / (maxVolts - minVolts) * 100));
		this.log('lifeline - battery', parsedBatPct);
		if (this.hasCapability('measure_battery') && this.hasCapability('alarm_battery')) {
			// Set Battery capability
			this.setCapabilityValue('measure_battery', parsedBatPct);
			// Set Battery alarm if battery percentatge is below 20%
			this.setCapabilityValue('alarm_battery', parsedBatPct < (this.getSetting('battery_threshold') || 20));
		}

		// temperature reportParser (ID 100)
		const parsedTemp = parsedData['100'] / 100.0;
		const temperatureOffset = this.getSetting('temperature_offset') || 0;
		this.log('lifeline - temperature', parsedTemp, '+ temperature offset', temperatureOffset);
		this.setCapabilityValue('measure_temperature', parsedTemp + temperatureOffset);

		// humidity reportParser (ID 101)
		const parsedHum = parsedData['101'] / 100.0;
		this.log('lifeline - humidity', parsedHum);
		this.setCapabilityValue('measure_humidity', parsedHum);

		// pressure reportParser (ID 102) - reported number not reliable
		// const parsedPres = parsedData['102'] / 100.0;
		// this.log('lifeline - pressure', parsedPres);

		function parseData(rawData) {
			const data = {};
			let index = 0;
			// let byteLength = 0
			while (index < rawData.length) {
				const type = rawData.readUInt8(index + 1);
				const byteLength = (type & 0x7) + 1;
				const isSigned = Boolean((type >> 3) & 1);
				// extract the relevant objects (1) Battery, (100) Temperature, (101) Humidity
				if ([1, 100, 101].includes(rawData.readUInt8(index))) {
					data[rawData.readUInt8(index)] = rawData[isSigned ? 'readIntLE' : 'readUIntLE'](index + 2, byteLength);
				}
				index += byteLength + 2;
			}
			return data;
		}
		*/
	}
}

module.exports = AqaraWeatherSensor;

// WSDCGQ11LM_weather

/*
Node overview:
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] ------------------------------------------
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] Node: 6364d680-e95a-4276-89eb-39f1a614f1e1
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] - Battery: false
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] - Endpoints: 0
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] -- Clusters:
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] --- zapp
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] --- genBasic
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] ---- 65281 : !�
f+��                                                                    !�!<$d)
!
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] ---- cid : genBasic
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] ---- sid : attrs
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] ---- modelId : lumi.weather
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] --- genIdentify
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] ---- cid : genIdentify
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] ---- sid : attrs
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] --- genGroups
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] ---- cid : genGroups
2018-03-03 15:04:39 [log] [ManagerDrivers] [weather] [0] ---- sid : attrs
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] --- msTemperatureMeasurement
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- cid : msTemperatureMeasurement
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- sid : attrs
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- measuredValue : 2061
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] --- msPressureMeasurement
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- 16 : 9947
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- 20 : -1
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- cid : msPressureMeasurement
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- sid : attrs
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- measuredValue : 994
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] --- msRelativeHumidity
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- cid : msRelativeHumidity
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- sid : attrs
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- measuredValue : 3485
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] --- manuSpecificCluster
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- cid : manuSpecificCluster
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ---- sid : attrs
2018-03-03 15:04:40 [log] [ManagerDrivers] [weather] [0] ------------------------------------------

65281 - 0xFF01 report:
{ '1': 3069,		= Battery voltage
  '4': 5117,
  '5': 61,
  '6': 1,
  '10': 0,
  '100': 2094,	= temperature
  '101': 3676,	= humidity
  '102': 130557 = pressure - reported number not reliable
}
*/
