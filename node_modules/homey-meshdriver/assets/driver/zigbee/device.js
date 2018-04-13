'use strict';

const ZwaveDevice = require('homey-meshdriver').ZigBeeDevice;

class MyDevice extends ZigBeeDevice {
	
	onMeshInit() {
		this.log('MyDevice has been inited');
	}
	
}

module.exports = MyDevice;