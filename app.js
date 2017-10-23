'use strict';

const Homey = require('homey');
const Log = require('homey-log').Log;

class XiaomiZigbee extends Homey.App {

	onInit() {

		this.log('Xiaomi Zigbee app is running...');

	}

}

module.exports = XiaomiZigbee;
