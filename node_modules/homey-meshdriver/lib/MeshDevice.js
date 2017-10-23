'use strict';

const Homey = require('homey');

const i18n = {
	error: {
		'unknown': {
			en: 'Unknown error',
			nl: 'Onbekend probleem'
		},
		'invalid_ieeeaddr': {
			en: 'Device not found in network',
			nl: 'Apparaat niet gevonden in netwerk'
		}
	}
}

/**
 */
class MeshDevice extends Homey.Device {

	/**
	 * @private
	 */
	onInit( protocolId ) {
		super.onInit();
		
		this._protocolId = protocolId;
		this._debugEnabled = false;
		this._pollIntervals = {};

		if( this._protocolId === 'zwave' )
			this._manager = Homey.ManagerZwave;

		if( this._protocolId === 'zigbee' )
			this._manager = Homey.ManagerZigBee;

		this._manager.getNode( this )
			.then( node => {
				this.node = node;

				process.nextTick(() => {
					this.emit('__meshInit');
				});
			})
			.catch( err => {
				this.error( err );
				
				if (err && err.message) {
					this.setUnavailable( this.__( i18n.error[err.message] || i18n.error.unknown ) );
				} else {
					this.setUnavailable( err || this.__( i18n.error.unknown ) );
				}
			});
	}
	
	__( obj ) {	
		let language = Homey.ManagerI18n.getLanguage();
		return obj[ language ] || obj['en' ] || obj.toString();
	}

	_debug() {
		if( this._debugEnabled ) {
			this.log.bind( this, '[dbg]' ).apply( this, arguments );
		}
	}

	/**
	 * Enable debugging to the console
	 */
	enableDebug() {
		this._debugEnabled = true;
	}

	/**
	 * Disable debugging to the console
	 */
	disableDebug() {
		this._debugEnabled = false;
	}

	/**
	 * Remove all listeners and intervals from node
	 */
	onDeleted() {

		// Remove listeners on node
		if (this.node) this.node.removeAllListeners();

		// Clear all pollIntervals
		Object.keys(this._pollIntervals).forEach(capabilityId => {
			Object.values(this._pollIntervals[capabilityId]).forEach(interval => {
				clearInterval(interval);
			});
		});
	}
}

module.exports = MeshDevice;