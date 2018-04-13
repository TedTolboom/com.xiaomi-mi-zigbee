'use strict';

const Homey = require('homey');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;
//const ZigBeeLightDevice = require('homey-meshdriver').ZigBeeLightDevice;

class AqaraLightSwitchSingle extends ZigBeeDevice {

	onMeshInit() {

		// enable debugging
		// this.enableDebug();

		// print the node's info to the console
		// this.printNode();

		this.sceneMap = {
			0: {
				scene: 'Key Pressed 1 time'
			},
		};

		this._attrReportListeners['0_genOnOff'] = this._attrReportListeners['0_genOnOff'] || {};
		this._attrReportListeners['0_genOnOff']['onOff'] = this.onOnOffListener.bind(this);

		this._attrReportListeners['0_genBasic'] = this._attrReportListeners['0_genBasic'] || {};
		this._attrReportListeners['0_genBasic']['65281'] = this.onLifelineReport.bind(this);

		// define and register FlowCardTriggers
		this.onSceneAutocomplete = this.onSceneAutocomplete.bind(this);

		this.triggerButton1_button = new Homey.FlowCardTriggerDevice('button1_button');
		this.triggerButton1_button
			.register();

		// DEPRECATED flowCardTrigger for scene
		this.triggerButton1_scene = new Homey.FlowCardTriggerDevice('button1_scene');
		this.triggerButton1_scene
			.register()
			.registerRunListener((args, state) => {
				return Promise.resolve(args.scene === state.scene);
			});

	}

	onOnOffListener(repScene) {
		this.log('genOnOff - onOff', repScene);

		if (Object.keys(this.sceneMap).includes(repScene.toString())) {
			const remoteValue = {
				scene: this.sceneMap[repScene].scene,
			};
			// Trigger the trigger card with 1 dropdown option
			Homey.app.triggerButton1_scene.trigger(this, null, remoteValue);
			// Trigger the trigger card with tokens
			this.triggerButton1_button.trigger(this, remoteValue, null);

			// DEPRECATED Trigger the trigger card with 1 dropdown option
			this.triggerButton1_scene.trigger(this, null, remoteValue);
		}
	}

	onSceneAutocomplete(query, args, callback) {
		let resultArray = [];
		for (let sceneID in this.sceneMap) {
			resultArray.push({
				id: this.sceneMap[sceneID].scene,
				name: Homey.__(this.sceneMap[sceneID].scene),
			})
		}
		// filter for query
		resultArray = resultArray.filter(result => {
			return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
		});
		this.log(resultArray);
		return Promise.resolve(resultArray);
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

		function parseData(rawData) {
			const data = {};
			let index = 0;
			let byteLength = 0
			while (index <= rawData.length - 2 - byteLength) {
				const type = rawData.readUInt8(index + 1);
				byteLength = (type & 0x7) + 1;
				const isSigned = Boolean((type >> 3) & 1);
				console.log('parsing', index, type, byteLength, isSigned, index + 2 + byteLength <= rawData.length);
				data[rawData.readUInt8(index)] = rawData[isSigned ? 'readIntLE' : 'readUIntLE'](index + 2, byteLength);
				index += byteLength + 2;
			}
			return data;
		}
		*/
	}
}

module.exports = AqaraLightSwitchSingle;
