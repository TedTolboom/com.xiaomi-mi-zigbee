'use strict';

const Homey = require('homey');
const Log = require('homey-log').Log;

class XiaomiZigbee extends Homey.App {

	onInit() {

		this.log('Xiaomi Zigbee app is running...');
		this.triggerButton1_scene = new Homey.FlowCardTriggerDevice('trigger_button1_scene');
		this.triggerButton1_scene
			.register()
			.registerRunListener((args, state) => {
				return Promise.resolve(args.scene.id === state.scene);
			})
			.getArgument('scene')
			.registerAutocompleteListener((query, args, callback) => args.device.onSceneAutocomplete(query, args, callback));

		this.triggerButton2_scene = new Homey.FlowCardTriggerDevice('trigger_button2_scene');
		this.triggerButton2_scene
			.register()
			.registerRunListener((args, state) => {
				return Promise.resolve(args.button.id === state.button && args.scene.id === state.scene);
			})
		this.triggerButton2_scene
			.getArgument('scene')
			.registerAutocompleteListener((query, args, callback) => args.device.onSceneAutocomplete(query, args, callback));
		this.triggerButton2_scene
			.getArgument('button')
			.registerAutocompleteListener((query, args, callback) => args.device.onButtonAutocomplete(query, args, callback));
	}

}

module.exports = XiaomiZigbee;
