'use strict';

const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class XiaomiHumanBodySensor extends ZigBeeDevice {
	onMeshInit() {

		// Register attribute listener for occupancy
		this._attrReportListeners['0_msOccupancySensing'] = this._attrReportListeners['0_msOccupancySensing'] || {};
		this._attrReportListeners['0_msOccupancySensing']['occupancy'] = this.onOccupancyReport.bind(this);

		this._attrReportListeners['0_genBasic'] = this._attrReportListeners['0_genBasic'] || {};
		this._attrReportListeners['0_genBasic']['65281'] =
			this.onLifelineReport.bind(this);

        if(this.getCapabilityValue('alarm_motion')) {
            this.log('alarm_motion active');
            this.debounceMotionTimeout();
        }
	}

    debounceMotionTimeout() {
        // Set and clear motion timeout
        clearTimeout(this.motionTimeout);
        this.motionTimeout = setTimeout(() => {
            this.log('manual alarm_motion reset');
            this.setCapabilityValue('alarm_motion', false);
        }, (this.getSetting('alarm_motion_reset_window') || 300) * 1000);
    }

	onOccupancyReport(value) {
		this.log('alarm_motion', value === 1);
        this.debounceMotionTimeout();

		// Update capability value
		this.setCapabilityValue('alarm_motion', value === 1);
	}

	onLifelineReport(value) {
		this._debug('lifeline report', new Buffer(value, 'ascii'));

		const parsedData = parseData(new Buffer(value, 'ascii'));
		this._debug('parsedData', parsedData);

		// battery reportParser (ID 1)
		if (parsedData.hasOwnProperty('1')) {
			const parsedVolts = parsedData['1'] / 1000;
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
		}

		function parseData(rawData) {
			const data = {};
			let index = 0;
			while (index < rawData.length) {
				const type = rawData.readUInt8(index + 1);
				const byteLength = (type & 0x7) + 1;
				const isSigned = Boolean((type >> 3) & 1);
				//if ([1, 100, 101].includes(rawData.readUInt8(index))) {
				data[rawData.readUInt8(index)] = rawData[isSigned ? 'readIntLE' : 'readUIntLE'](index + 2, byteLength);
				//}
				index += byteLength + 2;
			}
			return data;
		}
	}

}

module.exports = XiaomiHumanBodySensor;

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