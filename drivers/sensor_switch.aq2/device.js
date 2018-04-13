'use strict';

const Homey = require('homey');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

let lastKey = null;

class AqaraWirelessSwitchAq2 extends ZigBeeDevice {
	async onMeshInit() {

		// enable debugging
		// this.enableDebug();

		// print the node's info to the console
		// this.printNode();

		// supported scenes and their reported attribute numbers (all based on reported data)
		this.sceneMap = {
			1: {
				scene: 'Key Pressed 1 time'
			},
			2: {
				scene: 'Key Pressed 2 times'
			},
			3: {
				scene: 'Key Pressed 3 times'
			},
			4: {
				scene: 'Key Pressed 4 times'
			},
		};

		this.registerAttrReportListener('genOnOff', 0x8000, 1, 3600, 1,
				this.onOnOffListener.bind(this), 0)
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener - genOnOff - 0x8000');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener - genOnOff - 0x8000', err);
			});

		this.registerAttrReportListener('genOnOff', 'onOff', 1, 3600, 1,
				this.onOnOffListener.bind(this), 0)
			.then(() => {
				// Registering attr reporting succeeded
				this.log('registered attr report listener - genOnOff - onOff');
			})
			.catch(err => {
				// Registering attr reporting failed
				this.error('failed to register attr report listener - genOnOff - onOff', err);
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
		this.log('genOnOff - onOff', repScene, this.sceneMap[repScene].scene, 'lastKey', lastKey);

		if (lastKey !== repScene) {
			lastKey = repScene;

			if (Object.keys(this.sceneMap).includes(repScene.toString())) {
				const remoteValue = {
					scene: this.sceneMap[repScene].scene,
				};
				this.log('Scene trigger', remoteValue.scene);

				// Trigger the trigger card with 1 dropdown option
				Homey.app.triggerButton1_scene.trigger(this, null, remoteValue);
				// Trigger the trigger card with tokens
				this.triggerButton1_button.trigger(this, remoteValue, null);

				// DEPRECATED Trigger the trigger card with 1 dropdown option
				this.triggerButton1_scene.trigger(this, null, remoteValue);

				// reset lastKey after the last trigger
				this.buttonLastKeyTimeout = setTimeout(() => {
					lastKey = null;
				}, 3000);
			}
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

		// contact alarm reportParser (ID 100)
		// const parsedContact = (parsedData['100'] === 1);
		// this.log('lifeline - contact alarm', parsedContact);
		// this.setCapabilityValue('alarm_contact', parsedContact);

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
module.exports = AqaraWirelessSwitchAq2;

// WXKG11LM_sensor_switch.aq2
/*
Node overview:
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ------------------------------------------
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] Node: 31956e48-9b41-47f5-a9b3-66ca8e09c15c
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] - Battery: false
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] - Endpoints: 0
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] -- Clusters:
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] --- zapp
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] --- genBasic
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- 65281 : !�
                                                                                  (!�!"$
!
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- cid : genBasic
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- sid : attrs
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- modelId : lumi.sensor_switch.aq2
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] --- genGroups
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- cid : genGroups
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- sid : attrs
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] --- genOnOff
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- cid : genOnOff
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- sid : attrs
2018-03-03 16:10:55 [log] [ManagerDrivers] [sensor_switch.aq2] [0] --- manuSpecificCluster
2018-03-03 16:10:56 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- cid : manuSpecificCluster
2018-03-03 16:10:56 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ---- sid : attrs
2018-03-03 16:10:56 [log] [ManagerDrivers] [sensor_switch.aq2] [0] ------------------------------------------

65281 - 0xFF01 report:
{ '1': 3069,	=	Battery
'3': 23, 			= soc_temperature
'4': 5117,
'5': 34,
'6': 0,
'10': 0 }
*/
