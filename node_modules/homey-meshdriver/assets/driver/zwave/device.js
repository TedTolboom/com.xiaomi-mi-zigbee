'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class MyDevice extends ZwaveDevice {
	
	onMeshInit() {
		this.log('MyDevice has been inited');
	}
	
}

module.exports = MyDevice;