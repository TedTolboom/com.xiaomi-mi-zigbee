'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class AqaraHumanBodySensor extends ZigBeeDevice {
	onMeshInit() {
		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// Register attribute listener for occupancy
		this.registerAttrReportListener('msOccupancySensing', 'occupancy', 1, 60, 1,
				this.onOccupancyReport.bind(this), 0)
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener - msOccupancySensing');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener - msOccupancySensing', err);
			});

		// Register attribute listener for illuminance measurements
		this.registerAttrReportListener('msIlluminanceMeasurement', 'measuredValue', 1, 60, 1,
				this.onIlluminanceReport.bind(this), 0)
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener - msIlluminanceMeasurement');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener - msIlluminanceMeasurement', err);
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

	onIlluminanceReport(value) {
		this.log('measure_luminance', value);
		this.setCapabilityValue('measure_luminance', value);
	}

	onLifelineReport(value) {
		this.log('lifeline report', new Buffer(value, 'ascii'));
		/*
		const parsedData = parseData(new Buffer(value, 'ascii'));
		// this.log('parsedData', parsedData);

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

		// Luminance reportParser (ID 100)
		// const parsedLuminance = (parsedData['100']);
		// this.log('lifeline - luminacen', parsedLuminance);
		// this.setCapabilityValue('measure_luminance', parsedLuminance);

		function parseData(rawData) {
			const data = {};
			let index = 0;
			while (index < rawData.length) {
				const type = rawData.readUInt8(index + 1);
				const byteLength = (type & 0x7) + 1;
				const isSigned = Boolean((type >> 3) & 1);
				data[rawData.readUInt8(index)] = rawData[isSigned ? 'readIntLE' : 'readUIntLE'](index + 2, byteLength);
				index += byteLength + 2;
			}
			return data;
		}
		*/
	}
}

module.exports = AqaraHumanBodySensor;

// RTCGQ11LM_sensor_motion

/*
Node overview:
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

65281 - 0xFF01 report:
{ '1': 3069,	= battery
  '3': 22,
  '4': 12797,
  '5': 23,
  '6': 1,
  '10': 0,
  '11': 2,
  '100': 0		= measure_luminance / motion alarm
}

*/
