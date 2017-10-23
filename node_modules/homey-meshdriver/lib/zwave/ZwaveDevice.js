'use strict';

const MeshDevice = require('../MeshDevice.js');

/**
 * @extends MeshDevice
 */
class ZwaveDevice extends MeshDevice {

	/*
	 *	Homey methods
	 */

	/**
	 * @private
	 */
	onInit() {
		super.onInit('zwave');

		this._capabilities = {};
		this._settings = {};
		this._reportListeners = {};
		this._pollIntervals = {};
		this._pollIntervalsKeys = {};

		this.once('__meshInit', () => {
			this.log('ZwaveDevice has been inited');
			this.onMeshInit && this.onMeshInit();
		});
	}

	/**
	 * @private
	 */
	onSettings(oldSettings, newSettings, changedKeysArr) {

		for (let i = 0; i < changedKeysArr.length; i++) {
			const changedKey = changedKeysArr[i];
			const newValue = newSettings[changedKey];

			// check for poll interval
			if (this._pollIntervalsKeys[changedKey]) {
				this._setPollInterval(
					this._pollIntervalsKeys[changedKey].capabilityId,
					this._pollIntervalsKeys[changedKey].commandClassId,
					newValue
				);
				continue;
			}

			let manifestSetting;
			const manifest = this.getDriver().getManifest();
			if (manifest && manifest.settings) {
				for (let j = 0; j < manifest.settings.length; j++) {
					const setting = manifest.settings[j];
					if (setting.id !== changedKey) continue;
					manifestSetting = setting.zwave;
				}
			}

			if (typeof manifestSetting === 'undefined') continue;

			// get the parser
			const parser = this._settings[changedKey] || this._systemSettingParser;
			if (typeof parser !== 'function') {
				return Promise.reject(new Error('invalid_parser'));
			}

			const parsedValue = parser.call(this, newValue, manifestSetting);
			if (parsedValue instanceof Error) {
				return Promise.reject(parsedValue);
			}

			if (!Buffer.isBuffer(parsedValue)) {
				return Promise.reject(new Error('invalid_buffer'));
			}

			if (parsedValue.length !== manifestSetting.size) {
				return Promise.reject(new Error('invalid_buffer_length'));
			}

			this.node.CommandClass.COMMAND_CLASS_CONFIGURATION.CONFIGURATION_SET({
				'Parameter Number': manifestSetting.index,
				Level: {
					Size: parsedValue.length,
					Default: false,
				},
				'Configuration Value': parsedValue,
			}, (err, result) => {
				if (err) return this._debug('CONFIGURATION_SET', err);
			});

		}

		return Promise.resolve();
	}

	/*
		Private methods
	*/


	/**
	 * @private
	 */
	_systemSettingParser(newValue, manifestSetting) {

		if (typeof newValue === 'boolean') {
			return new Buffer([(newValue === true) ? 1 : 0]);
		}

		if (typeof newValue === 'number' || parseInt(newValue, 10).toString() === newValue) {
			if (manifestSetting.signed === false) {

				try {
					const buf = new Buffer(manifestSetting.size);
					buf.writeUIntBE(newValue, 0, manifestSetting.size);
					return buf;
				} catch (err) {
					return err;
				}

			} else {

				try {
					const buf = new Buffer(manifestSetting.size);
					buf.writeIntBE(newValue, 0, manifestSetting.size);
					return buf;
				} catch (err) {
					return err;
				}

			}
		}
	}


	/**
	 * @private
	 */
	_registerCapabilityGet(capabilityId, commandClassId) {

		const capabilityGetObj = this._getCapabilityObj('get', capabilityId, commandClassId);
		if (capabilityGetObj instanceof Error) return capabilityGetObj;

		// get initial value on start if null, unless it's an offline battery device and the getOnOnline flag is also set
		const initialCapabilityValue = this.getCapabilityValue(capabilityId);

		if (capabilityGetObj.opts.getOnStart) {
			if (initialCapabilityValue === null || capabilityGetObj.opts.getOnStartForce === true) {
				if (!(this.node.battery && this.node.online === false && capabilityGetObj.opts.getOnOnline === true)) {
					this._getCapabilityValue(capabilityId, commandClassId);
				}
			}
		}

		if (capabilityGetObj.opts.getOnOnline) {
			this.node.on('online', () => {
				this._debug(`Node online, getting commandClassId '${commandClassId}' for capabilityId '${capabilityId}'`);
				this._getCapabilityValue(capabilityId, commandClassId);
			});
		}

		if (capabilityGetObj.opts.pollInterval) {

			let pollInterval;

			if (typeof capabilityGetObj.opts.pollInterval === 'number') {
				pollInterval = capabilityGetObj.opts.pollInterval;
			}

			if (typeof capabilityGetObj.opts.pollInterval === 'string') {
				pollInterval = this.getSetting(capabilityGetObj.opts.pollInterval);
				this._pollIntervalsKeys[capabilityGetObj.opts.pollInterval] = {
					capabilityId,
					commandClassId,
				};
			}

			this._setPollInterval(capabilityId, commandClassId, pollInterval);

		}

	}


	/**
	 * @private
	 */
	_setPollInterval(capabilityId, commandClassId, pollInterval) {

		this._pollIntervals[capabilityId] = this._pollIntervals[capabilityId] || {};

		if (this._pollIntervals[capabilityId][commandClassId]) {
			clearInterval(this._pollIntervals[capabilityId][commandClassId]);
		}

		if (pollInterval < 1) return;

		this._pollIntervals[capabilityId][commandClassId] = setInterval(() => {
			this._debug(`Polling commandClassId '${commandClassId}' for capabilityId '${capabilityId}'`);
			this._getCapabilityValue(capabilityId, commandClassId);
		}, pollInterval);

	}


	/**
	 * @private
	 */
	_getCapabilityValue(capabilityId, commandClassId) {

		const capabilityGetObj = this._getCapabilityObj('get', capabilityId, commandClassId);
		if (capabilityGetObj instanceof Error) return capabilityGetObj;

		let parsedPayload = {};

		if (typeof capabilityGetObj.parser === 'function') {
			parsedPayload = capabilityGetObj.parser.call(this);
			if (parsedPayload instanceof Error) return this.error(parsedPayload);
		}

		try {
			const commandClass = capabilityGetObj.node.CommandClass[`COMMAND_CLASS_${capabilityGetObj.commandClassId}`];
			const command = commandClass[capabilityGetObj.commandId];

			return command.call(command, parsedPayload, (err, payload) => {
				if (err) return this.error(err);

				const result = this._onReport(capabilityId, commandClassId, payload);
				if (result instanceof Error) return this.error(result);
			});
		} catch (err) {
			return this.error(err);
		}

	}


	/**
	 * @private
	 */
	_registerCapabilitySet(capabilityId, commandClassId) {

		const capabilitySetObj = this._getCapabilityObj('set', capabilityId, commandClassId);
		if (capabilitySetObj instanceof Error) return capabilitySetObj;

		this.registerCapabilityListener(capabilityId, (value, opts) => {

			if (typeof capabilitySetObj.parser !== 'function') return Promise.reject(new Error('missing_parser'));

			const parsedPayload = capabilitySetObj.parser.call(this, value, opts);
			if (parsedPayload instanceof Error) return Promise.reject(parsedPayload);

			try {
				const commandClass = capabilitySetObj.node.CommandClass[`COMMAND_CLASS_${capabilitySetObj.commandClassId}`];
				const command = commandClass[capabilitySetObj.commandId];

				return command.call(command, parsedPayload);
			} catch (err) {
				return Promise.reject(err);
			}

		});

	}


	/**
	 * @private
	 */
	_registerCapabilityRealtime(capabilityId, commandClassId) {

		const capabilityReportObj = this._getCapabilityObj('report', capabilityId, commandClassId);
		if (capabilityReportObj instanceof Error) return capabilityReportObj;

		const commandClass = capabilityReportObj.node.CommandClass[`COMMAND_CLASS_${capabilityReportObj.commandClassId}`];
		if (typeof commandClass === 'undefined') return this.error('Invalid commandClass:', capabilityReportObj.commandClassId);

		commandClass.on('report', (command, payload) => {
			if (command.name !== capabilityReportObj.commandId) return;

			const parsedPayload = this._onReport(capabilityId, commandClassId, payload);
			if (parsedPayload instanceof Error) return;

			if (this._reportListeners[commandClassId] &&
				this._reportListeners[commandClassId][command.name]) {
				this._reportListeners[commandClassId][command.name](payload, parsedPayload);
			}
		});
	}

	/**
	 * @private
	 */
	_onReport(capabilityId, commandClassId, payload) {

		const capabilityReportObj = this._getCapabilityObj('report', capabilityId, commandClassId);
		if (capabilityReportObj instanceof Error) return capabilityReportObj;
		if (typeof capabilityReportObj.parser !== 'function') return new Error('Missing report parser');

		const parsedPayload = capabilityReportObj.parser.call(this, payload);
		if (parsedPayload instanceof Error) return parsedPayload;
		if (parsedPayload === null) return new Error('parsedPayload is null');

		this.setCapabilityValue(capabilityId, parsedPayload);

		return parsedPayload;


	}

	/**
	 * @private
	 */
	_getCapabilityObj(commandType, capabilityId, commandClassId) {

		const capability = this._capabilities[capabilityId];
		let commandClass;

		if (typeof commandClassId !== 'undefined') {
			commandClass = capability[commandClassId];
		} else {
			for (const commandClassId in capability) {
				commandClass = capability[commandClassId];
			}
		}

		if (typeof commandClass === 'undefined') {
			return new Error('missing_zwave_capability');
		}

		const commandId = commandClass[commandType];
		const opts = commandClass[`${commandType}Opts`] || {};
		let node = this.node;

		if (typeof commandClass.multiChannelNodeId === 'number') {
			node = this.node.MultiChannelNodes[commandClass.multiChannelNodeId];
			if (typeof node === 'undefined') {
				throw new Error(`Invalid multiChannelNodeId ${commandClass.multiChannelNodeId} for capabilityId ${capabilityId} and commandClassId ${commandClassId}`);
			}
		}

		let parser = null;
		const nodeCommandClass = node.CommandClass[`COMMAND_CLASS_${commandClassId}`];
		const nodeCommandClassVersion = nodeCommandClass.version;

		for (let i = nodeCommandClassVersion; i > 0; i--) {
			const fn = commandClass[`${commandType}ParserV${i}`];
			if (typeof fn === 'function') {
				parser = fn;
				break;
			}
		}

		if (parser === null && typeof commandClass[`${commandType}Parser`] === 'function') {
			parser = commandClass[`${commandType}Parser`];
		}

		if (typeof commandId === 'string') {
			return {
				commandClassId,
				commandId,
				parser,
				opts,
				node,
			};
		}

		return new Error('missing_zwave_capability');

	}

	/*
	 * Public methods
	 */

	/**
	 * Register a Homey Capability with a Command Class.
	 * Multiple `parser` methods can be provided by appending a version, e.g. `getParserV3`. This will make sure that the highest matching version will be used, falling back to `getParser`.
	 * @param {string} capabilityId - The Homey capability id (e.g. `onoff`)
	 * @param {string} commandClassId - The command class id (e.g. `BASIC`)
	 * @param {Object} [opts] - The object with options for this capability/commandclass combination. These will extend system options, if available (`/lib/zwave/system/`)
	 * @param {String} [opts.get] - The command to get a value (e.g. `BASIC_GET`)
	 * @param {String} [opts.getParser] - The function that is called when a GET request is made. Should return an Object.
	 * @param {Object} [opts.getOpts
	 * @param {Boolean} [opts.getOpts.getOnStart] - Get the value on App start
	 * @param {Boolean} [opts.getOpts.getOnOnline] - Get the value when the device is marked as online
	 * @param {Number|String} [opts.getOpts.pollInterval] - Interval to poll with a GET request. When provided a string, the device's setting with the string as ID will be used (e.g. `poll_interval`)
	 * @param {String} [opts.set] - The command to set a value (e.g. `BASIC_SET`)
	 * @param {Function} [opts.setParser] - The function that is called when a SET request is made. Should return an Object.
	 * @param {Mixed} [opts.setParser.value] - The value of the Homey capability
	 * @param {Object} [opts.setParser.opts] - Options for the capability command
	 * @param {String} [opts.report] - The command to report a value (e.g. `BASIC_REPORT`)
	 * @param {Function} [opts.reportParser] - The function that is called when a REPORT request is made. Should return an Object.
	 * @param {Object} [opts.reportParser.report] - The report object
	 * @param {Number} [opts.multiChannelNodeId] - An ID to use a MultiChannel Node for this capability
	 */
	registerCapability(capabilityId, commandClassId, userOpts) {

		// register the Z-Wave capability listener
		this._capabilities[capabilityId] = this._capabilities[capabilityId] || {};
		this._capabilities[capabilityId][commandClassId] = this._capabilities[capabilityId][commandClassId] || {};

		// merge systemOpts & userOpts
		let systemOpts = {};
		try {
			systemOpts = require(`./system/capabilities/${capabilityId}/${commandClassId}.js`);
		} catch (err) {
			if (err.code !== 'MODULE_NOT_FOUND') {
				process.nextTick(() => {
					throw err;
				});
			}
		}

		this._capabilities[capabilityId][commandClassId] = Object.assign(
			systemOpts || {},
			userOpts || {}
		);

		// register get/set/realtime
		this._registerCapabilityRealtime(capabilityId, commandClassId);
		this._registerCapabilitySet(capabilityId, commandClassId);
		this._registerCapabilityGet(capabilityId, commandClassId);
	}


	/**
	 * Register a setting parser, which is called when a setting has changed.
	 * @param {string} settingId - The setting ID, as specified in `/app.json`
	 * @param {Function} parserFn - The parser function, must return a Buffer
	 * @param {Mixed} parserFn.value - The setting value
	 * @param {Mixed} parserFn.zwaveObj - The setting's `zwave` object as defined in `/app.json`
	 */
	registerSetting(settingId, parserFn) {
		this._settings[settingId] = parserFn;
	}

	/**
	 * Register a report listener, which is called when a report has been received.
	 * @param {string} commandClassId - The ID of the Command Class (e.g. `BASIC`)
	 * @param {string} commandId - The ID of the Command (e.g. `BASIC_REPORT`)
	 * @param {Function} triggerFn
	 * @param {Object} triggerFn.report - The received report
	 */
	registerReportListener(commandClassId, commandId, triggerFn) {
		const commandClass = this.node.CommandClass[`COMMAND_CLASS_${commandClassId}`];
		if (typeof commandClass === 'undefined') return this.error('Invalid commandClass:', commandClassId);

		this._reportListeners[commandClassId] = this._reportListeners[commandClassId] || {};
		this._reportListeners[commandClassId][commandId] = triggerFn;

		commandClass.on('report', (command, payload) => {
			if (command.name !== commandId) return;
			if (this._reportListeners[commandClassId] &&
				this._reportListeners[commandClassId][command.name]) {
				this._reportListeners[commandClassId][command.name](payload);
			}
		});
	}

	/**
	 * Print the current Node information with Command Classes and their versions
	 */
	printNode() {
		this.log('------------------------------------------');

		// log the entire Node
		this.log('Node:', this.getData().token);
		this.log('- Battery:', this.node.battery);

		Object.keys(this.node.CommandClass).forEach(commandClassId => {
			this.log('- CommandClass:', commandClassId);
			this.log('-- Version:', this.node.CommandClass[commandClassId].version);
			this.log('-- Commands:');

			Object.keys(this.node.CommandClass[commandClassId]).forEach(key => {
				if (typeof this.node.CommandClass[commandClassId][key] === 'function' && key === key.toUpperCase()) {
					this.log('---', key);
				}
			});
		});

		if (this.node.MultiChannelNodes) {
			Object.keys(this.node.MultiChannelNodes).forEach(multiChannelNodeId => {
				this.log('- MultiChannelNode:', multiChannelNodeId);

				Object.keys(this.node.MultiChannelNodes[multiChannelNodeId].CommandClass).forEach(commandClassId => {
					this.log('-- CommandClass:', commandClassId);
					this.log('--- Version:',
						this.node.MultiChannelNodes[multiChannelNodeId].CommandClass[commandClassId].version);
					this.log('--- Commands:');

					Object
						.keys(this.node.MultiChannelNodes[multiChannelNodeId].CommandClass[commandClassId])
						.forEach(key => {
							if (typeof this.node.MultiChannelNodes[multiChannelNodeId].CommandClass[commandClassId][key] ===
								'function' && key === key.toUpperCase()) {
								this.log('----', key);
							}
						});
				});
			});
		}

		this.log('------------------------------------------');
		this.log('');

		Object.keys(this.node.CommandClass).forEach(commandClassId => {
			this.node.CommandClass[commandClassId].on('report', function () {
				this.log(`node.CommandClass['${commandClassId}'].on('report')`, 'arguments:', arguments);
			}.bind(this));
		});

		if (this.node.MultiChannelNodes) {
			Object.keys(this.node.MultiChannelNodes).forEach(multiChannelNodeId => {
				Object.keys(this.node.MultiChannelNodes[multiChannelNodeId].CommandClass).forEach(commandClassId => {
					this.node.MultiChannelNodes[multiChannelNodeId].CommandClass[commandClassId].on('report', function () {
						this.log(`node.MultiChannelNodes['${multiChannelNodeId}'].
						CommandClass['${commandClassId}'].on('report')`, 'arguments:', arguments);
					}.bind(this));
				});
			});
		}
	}

}

module.exports = ZwaveDevice;
