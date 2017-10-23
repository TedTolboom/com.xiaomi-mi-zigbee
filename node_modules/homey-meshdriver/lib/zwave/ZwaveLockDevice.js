'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class ZwaveLockDevice extends ZwaveDevice {
	onMeshInit() {

		// Register capabilities
		if (this.hasCapability('locked')) this.registerCapability('locked', 'DOOR_LOCK');
		if (this.hasCapability('locked')) this.registerCapability('locked', 'NOTIFICATION');
		if (this.hasCapability('alarm_battery')) this.registerCapability('alarm_battery', 'BATTERY');
		if (this.hasCapability('measure_battery')) this.registerCapability('measure_battery', 'BATTERY');

		// Register Flow card trigger
		const _flowTriggerLockJammed = new Homey.FlowCardTriggerDevice('lockJammed').register();

		// Check if Flow card is registered in app manifest
		if (!(_flowTriggerLockJammed instanceof Error)) {

			// Handle lock jammed notification
			this.on('lockJammedNotification', async () => {
				this.log('lock jammed notification');
				try {
					await _flowTriggerLockJammed.trigger(this, {}, {});
				} catch (err) {
					this.error('failed_to_trigger_lock_jammed_flow', err);
				}
			});
		} else this.error('missing_lockJammed_flow_card_in_manifest');
	}
}

module.exports = ZwaveLockDevice;
