'use strict';

const Homey = require('homey');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;
//const ZigBeeLightDevice = require('homey-meshdriver').ZigBeeLightDevice;

class AqaraLightControlSingle extends ZigBeeDevice {

	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// Register onoff capability
		this.registerCapability('onoff', 'genOnOff', {
			getOpts: {
				pollInterval: 3000,
			},
		});
	}

}

module.exports = AqaraLightControlSingle;
