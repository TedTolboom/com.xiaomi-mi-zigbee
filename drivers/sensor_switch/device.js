'use strict';

const Homey = require('homey');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

let keyHeld = false;
let lastKey = null;

class XiaomiWirelessSwitch extends ZigBeeDevice {
	async onMeshInit() {

		// enable debugging
		// this.enableDebug();

		// print the node's info to the console
		// this.printNode();

		// supported scenes and their reported attribute numbers (1 - 4 based on reported data, 90,91 custom code)
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
			90: {
				scene: 'Key Held Down'
			},
			91: {
				scene: 'Key Released'
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

		// define and register FlowCardTriggers
		this.onSceneAutocomplete = this.onSceneAutocomplete.bind(this);

		this.triggerButton1_button = new Homey.FlowCardTriggerDevice('button1_button');
		this.triggerButton1_button
			.register();

		// DEPRECATED flowCardTrigger for scene
		this.triggerButton1_scene = new Homey.FlowCardTriggerDevice('button1_scene_held');
		this.triggerButton1_scene
			.register()
			.registerRunListener((args, state) => {
				this.log(args.scene, state.scene, args.scene === state.scene);
				return Promise.resolve(args.scene === state.scene);
			});

	}

	onOnOffListener(repScene) {
		this.log('genOnOff - onOff', repScene, 'lastKey', lastKey, 'keyHeld', keyHeld);
		if (lastKey !== repScene) {
			lastKey = repScene;
			let remoteValue = null;

			if (repScene === 0) {
				keyHeld = false;
				this.buttonHeldTimeout = setTimeout(() => {
					keyHeld = true;
					remoteValue = {
						scene: this.sceneMap[90].scene,
					};
					this.log('Scene trigger', remoteValue.scene);

					// Trigger the trigger card with 1 autocomplete option
					Homey.app.triggerButton1_scene.trigger(this, null, remoteValue);
					// Trigger the trigger card with tokens
					this.triggerButton1_button.trigger(this, remoteValue, null);

					// DEPRECATED Trigger the trigger card with 1 dropdown option
					this.triggerButton1_scene.trigger(this, null, remoteValue);

				}, (this.getSetting('button_long_press_threshold') || 1000));
			}
			if (repScene !== 0 && Object.keys(this.sceneMap).includes(repScene.toString())) {

				clearTimeout(this.buttonHeldTimeout);
				remoteValue = {
					scene: this.sceneMap[keyHeld && repScene === 1 ? 91 : repScene].scene,
				};

				this.log('Scene trigger', remoteValue.scene, repScene);

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
}
module.exports = XiaomiWirelessSwitch;

// sensor_switch
/*
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ZigBeeDevice has been inited
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ------------------------------------------
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] Node: 8dd56393-7c25-4191-bc4d-7b87d44ae5fb
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] - Battery: false
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] - Endpoints: 0
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] -- Clusters:
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- zapp
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genBasic
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genBasic
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- modelId : lumi.sensor_switch
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genIdentify
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genIdentify
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genGroups
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genGroups
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genScenes
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genScenes
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genOnOff
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genOnOff
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- onOff : 1
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genLevelCtrl
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genLevelCtrl
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- genOta
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : genOta
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] --- manuSpecificCluster
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- cid : manuSpecificCluster
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ---- sid : attrs
2017-10-23 21:26:29 [log] [ManagerDrivers] [sensor_switch] [0] ------------------------------------------
*/
