'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroPlugDevice extends ZwaveDevice {
	
	onMeshInit() {
		
		// enable debugging
		this.enableDebug();
		
		// print the node's info to the console
		this.printNode();
		
		// register the `onoff` capability with COMMAND_CLASS_SWITCH_BINARY
		this.registerCapability('onoff', 'SWITCH_BINARY', {
			getOpts: {
				getOnStart: true, // get the initial value on app start
				pollInterval: 'poll_interval' // maps to device settings
				// getOnWakeUp: true, // only useful for battery devices
			},
			getParserV3: ( value, opts ) => {
				return {};
			}
		});
		
		// register a settings parser
		this.registerSetting('always_on', value => {			
			return new Buffer([ (value === true) ? 0 : 1 ])
		});
		
		// register a report listener
		this.registerReportListener('SWITCH_BINARY', 'SWITCH_BINARY_REPORT', ( rawReport, parsedReport ) => {
			console.log('registerReportListener', rawReport, parsedReport);
		});
		
	}
	
	// Overwrite the onSettings method, and change the Promise result
	onSettings( oldSettings, newSettings, changedKeysArr ) {
		return super.onSettings(oldSettings, newSettings, changedKeysArr)
			.then( res => {
				return 'Success!';
			})
			.catch( err => {
				return 'Error!';
			})
	}
	
}

module.exports = FibaroPlugDevice;