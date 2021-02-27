'use strict';

const Homey = require('homey');
const MeshDevice = require('../MeshDevice.js');

const commandClassParsers = {
	NOTIFICATION: payload => require('./system/commandclasses/NOTIFICATION')(payload),
	METER: payload => require('./system/commandclasses/METER')(payload),
	SENSOR_ALARM: payload => require('./system/commandclasses/SENSOR_ALARM')(payload),
	SENSOR_MULTILEVEL: payload => require('./system/commandclasses/SENSOR_MULTILEVEL')(payload),
};

const i18n = {
	settings: {
		offlineNodeSaveMessage: {
			en: 'Settings will be saved during the next automatic wakeup of this device, this might take a while. Activate "learn mode" on the device to update settings immediately.',
			nl: 'Instellingen zullen worden opgeslagen bij de volgende automatische wakeup van dit apparaat, dit kan een tijdje duren. Activeer de leermodus van het apparaat om de instellingen meteen op te slaan.',
		},
	},
};

// TODO alarm_fire capability parser
// TODO light_hue capability parser
// TODO light_saturation capability parser
// TODO light_temperature capability parser
// TODO light_mode capability parser
// TODO lock_mode capability parser
// TODO alarm_pm25 capability parser
// TODO measure_pressure capability parser

/**
 * @extends MeshDevice
 * @desc {@link https://developer.athom.com/docs/apps/Device.html#getSetting Device settings} used by system capabilities:
 * - `invertWindowCoveringsDirection {boolean}` - Used by several windowcoverings capabilities, if true it will invert the up/down direction
 * - `invertWindowCoveringsTiltDirection {boolean}` - Used by several windowcoverings capabilities, if true it will invert the tilt direction
 * @property {string} thermostatSetpointType - The 'Setpoint Type' used in the THERMOSTAT_SETPOINT commandclass for the target_temperature capability
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
			this.printNodeSummary();
			if (typeof this.onMeshInit === 'function') {
				this.onMeshInit();
			}
		});
	}

	/**
	 * Remove all listeners and intervals from node
	 */
	onDeleted() {
		super.onDeleted();

		if (!this.node) return;

		// Remove all report listeners on command classes
		if (this.node.CommandClass) {
			Object.keys(this.node.CommandClass).forEach(commandClassId => {
				this.node.CommandClass[commandClassId].removeAllListeners();
			});
		}


		// Remove all report listeners on multi channel nodes
		if (this.node.MultiChannelNodes) {
			Object.keys(this.node.MultiChannelNodes).forEach(multiChannelNodeId => {
				Object.keys(this.node.MultiChannelNodes[multiChannelNodeId].CommandClass).forEach(commandClassId => {
					this.node.MultiChannelNodes[multiChannelNodeId].CommandClass[commandClassId].removeAllListeners();
				});
			});
		}
	}

	/**
	 * Method that handles changing settings for Z-Wave devices. It iterates over the changed settings and executes
	 * a CONFIGURATION_SET in sync. If all succeed, it will resolve, if one or more fail it will reject with an error
	 * of concatenated error messages (to see which settings failed if more than one).
	 * @param oldSettings
	 * @param newSettings
	 * @param changedKeysArr
	 * @returns {Promise.<T>}
	 */
	async onSettings(oldSettings, newSettings, changedKeysArr = []) {
		let changeSettingError = '';

		// Loop all changed settings
		for (const changedKey of changedKeysArr) {
			const newValue = newSettings[changedKey];

			// check for poll interval
			if (this._pollIntervalsKeys[changedKey]) {
				const capabilityGetObj = this._getCapabilityObj('get', this._pollIntervalsKeys[changedKey].capabilityId, this._pollIntervalsKeys[changedKey].commandClassId);
				const pollMultiplication = capabilityGetObj.opts.pollMultiplication || 1;
				const pollInterval = newValue * pollMultiplication;

				this._setPollInterval(
					this._pollIntervalsKeys[changedKey].capabilityId,
					this._pollIntervalsKeys[changedKey].commandClassId,
					pollInterval
				);
				continue;
			}

			// Get manifest setting object and execute configuration set
			const manifestSetting = (this.getManifestSettings().find(setting => setting.id === changedKey) || {}).zwave;

			// Non z-wave settings: see if there is a function to execute, otherwise do nothing.
			if (typeof manifestSetting === 'undefined') {

				if (this._settings.hasOwnProperty(changedKey)) {
					const parser = this._settings[changedKey];

					if (typeof parser === 'function') parser.call(this, newValue);
				}
				continue;
			}

			try {
				this.log(`configurationSet() -> ${changedKey}: ${newSettings[changedKey]}, ${manifestSetting.index}, ${manifestSetting.size}`);
				await this.configurationSet({
					id: changedKey,
					index: manifestSetting.index,
					size: manifestSetting.size,
					signed: (manifestSetting.hasOwnProperty('signed')) ? manifestSetting.signed : true,
				}, newSettings[changedKey]);
			} catch (err) {
				this.error(`failed_to_set_${changedKey}_to_${newValue}_size_${manifestSetting.size}`, err);
				let errorString = `${changeSettingError}failed_to_set_${changedKey}_to_${newValue}_size_${manifestSetting.size}`;
				if (changeSettingError.length > 0) errorString = `_${errorString}`;
				changeSettingError = errorString;
			}
		}

		// If one or more of the settings failed to set, reject
		if (changeSettingError.length > 0) return Promise.reject(new Error(changeSettingError));

		// Compose save message
		const saveMessage = this._composeCustomSaveMessage(oldSettings, newSettings, changedKeysArr);
		return Promise.resolve(saveMessage);
	}

	/**
	 * @private
	 */
	_composeCustomSaveMessage(oldSettings, newSettings, changedKeysArr) {

		// Provide user with proper feedback after clicking save
		let saveMessage = null;
		if (this.node.battery === true && this.node.online === false) saveMessage = Homey.__(i18n.settings.offlineNodeSaveMessage);
		if (typeof this.customSaveMessage === 'function') {
			const message = this.customSaveMessage(oldSettings, newSettings, changedKeysArr);

			if (typeof message !== 'object' && typeof message !== 'string') {
				this._debug('Save message\'s return value is not an object nor a string');
			} else if (typeof message === 'object' && !message.hasOwnProperty('en')) {
				this._debug('A custom save message needs at least the english translation');
			} else {
				saveMessage = message;
			}
		} else if (typeof this.customSaveMessage === 'object') {
			if (!this.customSaveMessage.hasOwnProperty('en')) {
				this._debug('A custom save message needs at least the english translation');
			} else {
				saveMessage = this.customSaveMessage;
			}
		}
		return saveMessage;
	}

	/*
     Private methods
     */

	/**
	 * Parses a given setting uses the registered setting parser or the system parser and returns the parsed value.
	 * @param {Object} settingObj
	 * @param {string} [settingObj.id] - Optional setting id (key) if provided in manifest
	 * @param settingObj.index - Parameter index
	 * @param settingObj.size - Parameter size
	 * @param settingObj.signed - Parameter signed or not
	 * @param value - Input value to parse
	 * @returns {Buffer|Error}
	 * @private
	 */
	_parseSetting(settingObj = {}, value) {
		let parser;
		let customParser;

		// get the parser
		if (typeof this._settings[settingObj.id] !== 'undefined') {
			parser = this._settings[settingObj.id];
			customParser = true;
		} else {
			parser = this._systemSettingParser;
		}

		if (typeof parser !== 'function') return new Error('invalid_parser');

		// Parse and check value
		let parsedValue = parser.call(this, value, settingObj);
		if (parsedValue instanceof Error) return parsedValue;
		if (!Buffer.isBuffer(parsedValue)) {

			if (customParser) {
				parsedValue = this._systemSettingParser(parsedValue, settingObj);

				if (!Buffer.isBuffer(parsedValue)) {
					return new Error('invalid_buffer');
				}
			} else {
				return new Error('invalid_buffer');
			}
		}

		if (parsedValue.length !== settingObj.size) return new Error('invalid_buffer_length');
		return parsedValue;
	}

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

		if (Buffer.isBuffer(newValue)) return newValue;
	}


	/**
	 * @private
	 */
	_registerCapabilityGet(capabilityId, commandClassId) {

		const capabilityGetObj = this._getCapabilityObj('get', capabilityId, commandClassId);
		if (capabilityGetObj instanceof Error) return capabilityGetObj;

		// Get capability value on device init
		if (capabilityGetObj.opts.getOnStart) {

			// But not for battery devices
			if (this.node.battery === false) this._getCapabilityValue(capabilityId, commandClassId).catch(err => this.error(`Could not get capability value for capabilityId: ${capabilityId}`, err));
			else this.error('do not use getOnStart for battery devices');
		}

		// Perform get on online, also when device is initing and device is still online
		if (capabilityGetObj.opts.getOnOnline) {

			// Get immediately if node is still online (right after pairing for example)
			if (this.node.battery === true && this.node.online === true) {
				this.log(`Node online, getting commandClassId '${commandClassId}' for capabilityId '${capabilityId}'`);
				this._getCapabilityValue(capabilityId, commandClassId).catch(err => this.error(`Could not get capability value for capabilityId: ${capabilityId}`, err));
			}

			// Bind online listener for future events
			this.node.on('online', online => {
				if (online) {
					this.log(`Node online, getting commandClassId '${commandClassId}' for capabilityId '${capabilityId}'`);
					this._getCapabilityValue(capabilityId, commandClassId).catch(err => this.error(`Could not get capability value for capabilityId: ${capabilityId}`, err));
				}
			});
		}

		if (capabilityGetObj.opts.pollInterval) {

			let pollInterval;
			const pollMultiplication = capabilityGetObj.opts.pollMultiplication || 1;

			if (typeof capabilityGetObj.opts.pollInterval === 'number') {
				pollInterval = (capabilityGetObj.opts.pollInterval * pollMultiplication);
			}

			if (typeof capabilityGetObj.opts.pollInterval === 'string') {
				pollInterval = (this.getSetting(capabilityGetObj.opts.pollInterval) * pollMultiplication);
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
			this._getCapabilityValue(capabilityId, commandClassId).catch(err => this.error(`Could not get capability value for capabilityId: ${capabilityId}`, err));
		}, pollInterval);

	}


  /**
   * @private
   */
  async _getCapabilityValue(capabilityId, commandClassId) {
    const capabilityGetObj = this._getCapabilityObj('get', capabilityId, commandClassId);
    if (capabilityGetObj instanceof Error) throw capabilityGetObj;

    let parsedPayload = {};

    if (typeof capabilityGetObj.parser === 'function') {
      parsedPayload = capabilityGetObj.parser.call(this);
      if (parsedPayload instanceof Error) throw parsedPayload;
    }

    const commandClass = capabilityGetObj.node.CommandClass[`COMMAND_CLASS_${capabilityGetObj.commandClassId}`];
    const command = commandClass[capabilityGetObj.commandId];

    return new Promise((resolve, reject) => {
      command.call(command, parsedPayload, (err, payload) => {
        if (err) return reject(err);

        const result = this._onReport(capabilityId, commandClassId, payload);
        if (result instanceof Error) return reject(result);

        return resolve(result);
      });
    });
  }

  /**
   * This method executes the capability set command for a given capability/commandClass combination. The capability
   * and commandClass must be registered before this method is called.
   * @param {string} capabilityId
   * @param {string} commandClassId
   * @param {Mixed} value - the capability value to set (e.g 0 - 1 for dim)
   * @param {Object} opts - capability options object
   * @returns {Promise<string|*>}
   * @private
   */
  async _setCapabilityValue(capabilityId, commandClassId, value, opts = {}) {
    if (typeof value === 'undefined') throw new Error(`_setCapabilityValue -> invalid value ${value} (capabilityId: ${capabilityId})`);
    if (typeof capabilityId === 'undefined') throw new Error(`_setCapabilityValue -> invalid capabilityId ${capabilityId}`);
    if (typeof commandClassId === 'undefined') throw new Error(`_setCapabilityValue -> invalid commandClassId ${commandClassId}`);

    const capabilitySetObj = this._getCapabilityObj('set', capabilityId, commandClassId);
    if (capabilitySetObj instanceof Error) throw capabilitySetObj;
    if (typeof capabilitySetObj.parser !== 'function') throw new Error('missing_parser');

    const parsedPayload = capabilitySetObj.parser.call(this, value, opts);
    if (parsedPayload instanceof Promise) return parsedPayload;
    if (parsedPayload instanceof Error) throw parsedPayload;
    if (parsedPayload === null) {
      this._debug(`WARNING: got parsedPayload null from capability (${capabilityId}) set parser, ignoring set.`);
      return 'IGNORED';
    }

    const commandClass = capabilitySetObj.node.CommandClass[`COMMAND_CLASS_${capabilitySetObj.commandClassId}`];
    const command = commandClass[capabilitySetObj.commandId];
    const commandSetPromise = command.call(command, parsedPayload);
    if (this.node.battery === true && this.node.online === false) return 'TRANSMIT_QUEUED';
    return commandSetPromise;
  }

	/**
	 * @private
   */
  _registerCapabilitySet(capabilityId, commandClassId) {

    const capabilitySetObj = this._getCapabilityObj('set', capabilityId, commandClassId);
    if (capabilitySetObj instanceof Error) return capabilitySetObj;

    this.registerCapabilityListener(capabilityId, (value, opts) => (async () => {
      return this._setCapabilityValue(capabilityId, commandClassId, value, opts)
    })().then(result => {
			if (typeof capabilitySetObj.opts.fn === 'function') {
				process.nextTick(() => {
					try {
						capabilitySetObj.opts.fn.call(this, value, opts);
					} catch (err) {
						this.error(err);
					}
				});
			}
			return result;
		}));
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
			if (parsedPayload === null) return;

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

		// parse the payload using a built-in Command Class parser
		const commandClassParsedPayload = this._parseCommandClassPayload(commandClassId, payload);

		const parsedPayload = capabilityReportObj.parser.call(this, commandClassParsedPayload);
		if (parsedPayload instanceof Error) return parsedPayload;
		if (parsedPayload === null) return parsedPayload;
		this._debug(`_onReport() -> ${capabilityId}, ${commandClassId} -> parsed payload: ${parsedPayload}`);
		this.setCapabilityValue(capabilityId, parsedPayload);

		try {
			if (typeof capabilityReportObj.opts.fn === 'function') {
				capabilityReportObj.opts.fn.call(this, parsedPayload);
			}
		} catch (err) {
			this.error(err);
		}

		return parsedPayload;
	}

	/**
	 * Extend a Command Class payload with parsed values, as provided by the Z-Wave specification
	 * @private
	 */
	_parseCommandClassPayload(commandClassId, payload) {
		const parser = commandClassParsers[commandClassId];
		if (parser) return parser(payload);
		return payload;
	}

	/**
	 * @private
	 */
	_getCapabilityObj(commandType, capabilityId, commandClassId) {

		// get capability and command class from the _capabilities object
		const capability = this._capabilities[capabilityId];
		let commandClass;

		if (typeof commandClassId !== 'undefined') {
			commandClass = capability[commandClassId];
		} else {
			for (const commandClassId in capability) {
				if (Object.prototype.hasOwnProperty.call(capabilityId, commandClassId)) {
					commandClass = capability[commandClassId];
				}
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
		if (commandType === 'report' && commandClass.reportParserOverride && typeof commandClass[`${commandType}Parser`] === 'function') {
			parser = commandClass[`${commandType}Parser`];
		} else {
			const nodeCommandClass = node.CommandClass[`COMMAND_CLASS_${commandClassId}`];
			if (typeof nodeCommandClass === 'undefined') return new Error(`missing_command_class_${commandClassId}`);
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

	/**
	 * Method that checks if a device class specific system capability is available and returns it if possible. Else it
	 * will return null.
	 * @param {string} capabilityId
	 * @param {string} commandClassId
	 * @returns {Object|null}
	 * @private
	 */
	_getDeviceClassSpecificSystemCapability(capabilityId, commandClassId) {
		try {
			return require(`./system/capabilities/${capabilityId}/${this.getClass()}/${commandClassId}.js`);
		} catch (err) {
			if (err.code !== 'MODULE_NOT_FOUND') this.error(err);
			return null;
		}
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
	 * @param {Boolean} [userOpts.getOpts.getOnStart] - Get the value on App start. Avoid using this option, it should only be used for values that the device does not automatically report.
	 * @param {Boolean} [userOpts.getOpts.getOnOnline] - Only for battery devices, get the value on device wake up. Avoid using this option, it should only be used for values that the device does not automatically report.
	 * @param {Number|String} [opts.getOpts.pollInterval] - Interval (in ms) to poll with a GET request. When provided a string, the device's setting with the string as ID will be used (e.g. `poll_interval`)
	 * @param {Number} [opts.getOpts.pollMultiplication] - Multiplication factor for the pollInterval key, must be a number. (e.g. 1000 to convert to seconds, 60.000 for minutes, 3600000 for hours)
	 * @param {String} [opts.set] - The command to set a value (e.g. `BASIC_SET`)
	 * @param {Function} [opts.setParser] - The function that is called when a SET request is made. Should return an Object.
	 * @param {Mixed} [opts.setParser.value] - The value of the Homey capability
	 * @param {Object} [opts.setParser.opts] - Options for the capability command
	 * @param {Function} [opts.fn] - This function is called after a setCapabilityValue has been called
	 * @param {Object} [opts.fn.value] - The capability value
	 * @param {Object} [opts.fn.opts] - The capability opts
	 * @param {String} [opts.report] - The command to report a value (e.g. `BASIC_REPORT`)
	 * @param {Boolean} [opts.reportParserOverride] - Boolean flag to determine if the `reportParser` method should override all report parsers. (Assumed false when not specified)
	 * @param {Function} [opts.reportParser] - The function that is called when a REPORT request is made. Should return an Object.
	 * @param {Object} [opts.reportParser.report] - The report object
	 * @param {Number} [opts.multiChannelNodeId] - An ID to use a MultiChannel Node for this capability
	 * @param {Function} [opts.fn] - This function is called after a setCapabilityValue has been executed
	 * @param {Object} [opts.fn.value] - The capability value
	 */
	registerCapability(capabilityId, commandClassId, userOpts) {

		// Check if device has the command class we're trying to register, if not, abort
		if (userOpts && typeof userOpts.multiChannelNodeId === 'number') {
			if (!this.node.MultiChannelNodes || !this.node.MultiChannelNodes[userOpts.multiChannelNodeId] || this.node.MultiChannelNodes[userOpts.multiChannelNodeId].CommandClass[`COMMAND_CLASS_${commandClassId}`] === 'undefined') {
				return this.error(`CommandClass: ${commandClassId} in multi channel node ${userOpts.multiChannelNodeId} undefined`);
			}
		} else if (typeof this.node.CommandClass[`COMMAND_CLASS_${commandClassId}`] === 'undefined') {
			return this.error(`CommandClass: ${commandClassId} in main node undefined`);
		}

		// register the Z-Wave capability listener
		this._capabilities[capabilityId] = this._capabilities[capabilityId] || {};
		this._capabilities[capabilityId][commandClassId] = this._capabilities[capabilityId][commandClassId] || {};

		// merge systemOpts & userOpts
		let systemOpts = {};

		// First, try get device class specific system capability
		systemOpts = this._getDeviceClassSpecificSystemCapability(capabilityId, commandClassId);

		// Second, try get device class specific system capability based on root capability (e.g. onoff.output1)
		const rootCapability = capabilityId.split('.')[0];
		if (!systemOpts) systemOpts = this._getDeviceClassSpecificSystemCapability(rootCapability, commandClassId);

		// Third, check for system capability
		try {
			if (!systemOpts) systemOpts = require(`./system/capabilities/${capabilityId}/${commandClassId}.js`);
		} catch(err) {
			if (err.code !== 'MODULE_NOT_FOUND') {
        process.nextTick(() => {
          throw err;
        });
      }
		}

		// Fourth, check for system capability based on root capability (e.g. onoff.output1)
		try {
			if (!systemOpts) systemOpts = require(`./system/capabilities/${rootCapability}/${commandClassId}.js`);
		} catch(err) {
			if (err.code !== 'MODULE_NOT_FOUND') {
        process.nextTick(() => {
          throw err;
        });
      }
		}
		
		// add implicit override for this capability's reportParser
		if (userOpts) {
			userOpts.reportParserOverride = typeof userOpts.reportParser === 'function' && userOpts.reportParserOverride === true;
		}

		this._capabilities[capabilityId][commandClassId] = Object.assign(
			{},
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
	 * @param {Function} parserFn - The parser function, must return a Buffer, number or boolean
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
		let previousSequence;

		this._reportListeners[commandClassId] = this._reportListeners[commandClassId] || {};
		this._reportListeners[commandClassId][commandId] = triggerFn;

		commandClass.on('report', (command, payload) => {
			if (command.name !== commandId) return;

			// Catch central scene echos and (sometimes) failing parser
			if (command.name === 'CENTRAL_SCENE_NOTIFICATION') {

				if (typeof previousSequence !== 'undefined' && payload.hasOwnProperty('Sequence Number') && payload['Sequence Number'] === previousSequence) return;
				previousSequence = payload['Sequence Number'];

				if (payload.hasOwnProperty('Properties1') &&
					payload.Properties1.hasOwnProperty('Key Attributes') &&
					typeof payload.Properties1['Key Attributes'] === 'number') {
					switch (payload.Properties1['Key Attributes']) {
						case 0:
							payload.Properties1['Key Attributes'] = 'Key Pressed 1 time';
							break;
						case 1:
							payload.Properties1['Key Attributes'] = 'Key Released';
							break;
						case 2:
							payload.Properties1['Key Attributes'] = 'Key Held Down';
							break;
						case 3:
							payload.Properties1['Key Attributes'] = 'Key Pressed 2 times';
							break;
						case 4:
							payload.Properties1['Key Attributes'] = 'Key Pressed 3 times';
							break;
						case 5:
							payload.Properties1['Key Attributes'] = 'Key Pressed 4 times';
							break;
						case 6:
							payload.Properties1['Key Attributes'] = 'Key Pressed 5 times';
							break;
					}
				}
			}

			if (this._reportListeners[commandClassId] &&
				this._reportListeners[commandClassId][command.name]) {
				this._reportListeners[commandClassId][command.name](payload);
			}
		});
	}

	/**
	 * Register a multi channel report listener, which is called when a report has been received.
	 * @param {number} multiChannelNodeId - The multi channel node id
	 * @param {string} commandClassId - The ID of the Command Class (e.g. `BASIC`)
	 * @param {string} commandId - The ID of the Command (e.g. `BASIC_REPORT`)
	 * @param {Function} triggerFn
	 * @param {Object} triggerFn.report - The received report
	 */
	registerMultiChannelReportListener(multiChannelNodeId, commandClassId, commandId, triggerFn) {
		// Check for valid multi channel nodes
		if (!this.node.MultiChannelNodes ||
			!this.node.MultiChannelNodes[multiChannelNodeId] ||
			(Array.isArray(this.node.MultiChannelNodes) && this.node.MultiChannelNodes.length === 0)) {
			return this.error('Invalid multi channel node', multiChannelNodeId);
		}

		const commandClass = this.node.MultiChannelNodes[multiChannelNodeId].CommandClass[`COMMAND_CLASS_${commandClassId}`];
		if (typeof commandClass === 'undefined') return this.error('Invalid commandClass:', commandClassId);

		this._reportListeners[commandClassId] = this._reportListeners[commandClassId] || {};
		this._reportListeners[commandClassId][`${multiChannelNodeId}_${commandId}`] = triggerFn;

		commandClass.on('report', (command, payload) => {
			if (command.name !== commandId) return;
			if (typeof this._reportListeners[commandClassId][`${multiChannelNodeId}_${command.name}`] === 'function') {
				this._reportListeners[commandClassId][`${multiChannelNodeId}_${command.name}`](payload);
			}
		});
	}

  /**
   * Method that will check if the node has the provided command class
   * @param {string} commandClassId - For example: SWITCH_BINARY
   * @param {Object} opts
   * @param {number} opts.multiChannelNodeId - Multi channel node id to check for command class
   * @returns {boolean}
   */
	hasCommandClass(commandClassId, opts = {}) {
		if (Object.prototype.hasOwnProperty.call(opts, 'multiChannelNodeId')) {
			if (typeof opts.multiChannelNodeId !== 'number') throw new Error('multi_channel_node_id_must_be_number');
			return !!(
				Object.prototype.hasOwnProperty.call(this.node, 'MultiChannelNodes') &&
				this.node.MultiChannelNodes[opts.multiChannelNodeId] &&
				this.node.MultiChannelNodes[opts.multiChannelNodeId].CommandClass[`COMMAND_CLASS_${commandClassId}`]
			);
		}
		return !(typeof this.node.CommandClass[`COMMAND_CLASS_${commandClassId}`] === 'undefined');
	}

	/**
	 * Method that gets a CommandClass object by commandClassId. Optionally, it can get the object on a multichannel node
	 * if the multiChannelNodeId is provided.
	 * @param {String} commandClassId
	 * @param {Object} opts
	 * @param {Number} opts.multiChannelNodeId - Provide this id if the command class should be located on a mc node.
	 * @returns {Error|boolean|*}
	 */
	getCommandClass(commandClassId, opts = {}) {
		if (Object.prototype.hasOwnProperty.call(opts, 'multiChannelNodeId')) {
			if (typeof opts.multiChannelNodeId !== 'number') throw new Error('multi_channel_node_id_must_be_number');
			if (!this.hasCommandClass(commandClassId, { multiChannelNodeId: opts.multiChannelNodeId })) {
				return new Error(`multi_channel_node_${opts.multiChannelNodeId}_is_missing_command_class_${commandClassId}`);
			}
			return this.node.MultiChannelNodes[opts.multiChannelNodeId].CommandClass[`COMMAND_CLASS_${commandClassId}`];
		}
		if (!this.hasCommandClass(commandClassId)) return new Error(`missing_command_class_${commandClassId}`);
		return this.node.CommandClass[`COMMAND_CLASS_${commandClassId}`];
	}

  /**
   * Method that gets all multi channel node ids that have a specific deviceClassGeneric.
   * @param {String} deviceClassGeneric
   * @returns {Array}
   */
  getMultiChannelNodeIdsByDeviceClassGeneric(deviceClassGeneric){
    if (!Object.prototype.hasOwnProperty.call(this.node, 'MultiChannelNodes')) return [];
    const foundNodeIds = [];
    for (const i in this.node.MultiChannelNodes) {
      if (this.node.MultiChannelNodes[i].deviceClassGeneric === deviceClassGeneric) {
        foundNodeIds.push(Number(i))
      }
    }
    return foundNodeIds;
  }

  /**
   * This method executes the capability set command for a given capability/commandClass combination. The capability
   * and commandClass must be registered before this method is called.
   * @param {string} capabilityId
   * @param {string} commandClassId
   * @param {Mixed} value - the capability value to set (e.g 0 - 1 for dim)
   * @param {Object} opts - capability options object
   * @returns {Promise<string|*>}
   */
  async executeCapabilitySetCommand(capabilityId, commandClassId, value, opts = {}) {
    return this._setCapabilityValue(capabilityId, commandClassId, value, opts);
  }


  /**
	 * Method that resets the accumulated power meter value on the node. It tries to find the root node of the device
	 * and then looks for the COMMAND_CLASS_METER.
	 * @param multiChannelNodeId - define the multi channel node id in case the COMMAND_CLASS_METER is on a multi channel node
	 * @returns {Promise<unknown>}
	 */
	async meterReset({ multiChannelNodeId } = {}) {

		// Get command class object (on mc node if needed)
		let commandClassMeter = null;
		if (typeof multiChannelNodeId === 'number') {
			commandClassMeter = this.getCommandClass('METER', { multiChannelNodeId });
		} else {
			commandClassMeter = this.getCommandClass('METER');
		}

		if (commandClassMeter && commandClassMeter.hasOwnProperty('METER_RESET')) {
			return new Promise((resolve, reject) => {
				commandClassMeter.METER_RESET({}, (err, result) => {
					if (err || result !== 'TRANSMIT_COMPLETE_OK') return reject(err || result);
					return resolve();
				});
			});
		}
		return Promise.reject(new Error('missing_meter_reset_command'));
	}

	/**
	 * Wrapper for CONFIGURATION_SET. Provide options.id and/or options.index and options.size. By default
	 * options.useSettingParser is true, then the value will first be parsed by the registered setting parser or the
	 * system parser before sending. It will only be able to use the registered setting parser if options.id is provided.
	 * @param options
	 * @param options.index
	 * @param options.size
	 * @param options.id
	 * @param [options.signed]
	 * @param [options.useSettingParser=true]
	 * @param value
	 * @returns {Promise.<*>}
	 */
	async configurationSet(options = {}, value) {
		if (!options.hasOwnProperty('index') && !options.hasOwnProperty('id')) return Promise.reject(new Error('missing_setting_index_or_id'));
		if (options.hasOwnProperty('index') && !options.hasOwnProperty('size')) return Promise.reject(new Error('missing_setting_size'));
		if (options.hasOwnProperty('id') && (!options.hasOwnProperty('size') || !options.hasOwnProperty('index') || !options.hasOwnProperty('signed'))) {

			// Fetch information from manifest by setting id
			const settingObj = this.getManifestSetting(options.id);
			if (settingObj instanceof Error) return Promise.reject(new Error('invalid_setting_id'));
			if (!settingObj.hasOwnProperty('zwave') || !settingObj.zwave.hasOwnProperty('index') ||
				!settingObj.zwave.hasOwnProperty('size') || typeof settingObj.zwave.index !== 'number' ||
				typeof settingObj.zwave.size !== 'number') {

				return Promise.reject(new Error('missing_valid_zwave_setting_object'));
			}
			options.index = settingObj.zwave.index;
			options.size = settingObj.zwave.size;

			if (!options.hasOwnProperty('signed')) {
				options.signed = (settingObj.zwave.hasOwnProperty('signed')) ? settingObj.zwave.signed : true;
			}
		}

		// Check if device has command class
		const commandClassConfiguration = this.getCommandClass('CONFIGURATION');
		if (commandClassConfiguration instanceof Error ||
			typeof commandClassConfiguration.CONFIGURATION_SET !== 'function') {
			this.error('Missing COMMAND_CLASS_CONFIGURATION');
			return Promise.reject(new Error('missing_command_class_configuration'));
		}

		// If desired the input value can be parsed by the provided parser or the system parser
		let parsedValue = null;
		if (!options.hasOwnProperty('useSettingParser') || options.useSettingParser === true) {
			parsedValue = this._parseSetting(options, value);
			if (parsedValue instanceof Error) return Promise.reject(parsedValue);
		} else if (!Buffer.isBuffer(value)) {
			return Promise.reject(new Error('invalid_value_type'));
		}

		return new Promise((resolve, reject) => {
			commandClassConfiguration.CONFIGURATION_SET({
				'Parameter Number': options.index,
				Level: {
					Size: options.size,
					Default: false,
				},
				'Configuration Value': parsedValue || value,
			}, (err, result) => {
				const parsedBufValue = parsedValue.toString('hex').toUpperCase();
				let parsedDecValue;

				try {
					if (!options.hasOwnProperty('signed') || options.signed === true) parsedDecValue = parsedValue.readIntBE(0, options.size);
					else parsedDecValue = parsedValue.readUIntBE(0, options.size);
				} catch (error) {
					this.error('failed to read the buffer value', error);
					parsedDecValue = 'N/A';
				}

				if (err) {
					this.error(`configurationSet() -> failed to set configuration parameter ${options.index}, size: ${options.size} to ${value} (parsed: ${parsedDecValue} /  0x${parsedBufValue})`);
					return reject(err);
				}
				this.log(`configurationSet() -> successfully set ${options.index}, size: ${options.size} to ${value} (parsed: ${parsedDecValue} / 0x${parsedBufValue})`);
				return resolve(result);
			});

			// If battery device which is offline, setting will be saved later, continue
			if (this.node.battery === true && this.node.online === false) return resolve();
		});
	}

	/**
	 * Method that retrieves the value of a configuration parameter from the node.
	 * @param {Object} options
	 * @param {number} options.index - Parameter index
	 * @returns {*}
	 */
	async configurationGet(options = {}) {
		if (!options.hasOwnProperty('index')) return Promise.reject(new Error('missing_index'));
		if (this.node.battery === true && this.node.online === false) return Promise.reject(new Error('cannot_get_parameter_from_battery_node'));

		// Check if device has command class
		const commandClassConfiguration = this.getCommandClass('CONFIGURATION');
		if (commandClassConfiguration instanceof Error ||
			typeof commandClassConfiguration.CONFIGURATION_GET !== 'function') {
			this.error('Missing COMMAND_CLASS_CONFIGURATION');
			return Promise.reject(new Error('missing_command_class_configuration'));
		}

		return commandClassConfiguration.CONFIGURATION_GET({
			'Parameter Number': options.index,
		});
	}

	/**
	 * Method that flattens possibly nested settings and returns a flat settings array.
	 * @returns {Array}
	 */
	getManifestSettings() {
		if (!this.manifestSettings) {
			const manifest = this.getDriver().getManifest();
			if (!manifest || !manifest.settings) return this.manifestSettings = [];

			const flattenSettings = (settings) => settings.reduce((manifestSettings, setting) => {
				if (setting.type === 'group') {
					return manifestSettings.concat(flattenSettings(setting.children));
				}
				manifestSettings.push(setting);
				return manifestSettings;
			}, []);

			this.manifestSettings = flattenSettings(manifest.settings);
		}
		return this.manifestSettings;
	}

	/**
	 * Get a specific setting object from the manifest
	 * @param id - Setting id to retrieve
	 * @returns {Object|Error}
	 */
	getManifestSetting(id) {
		const settings = this.getManifestSettings();
		if (Array.isArray(settings)) return settings.find(setting => setting.id === id);
		return new Error(`missing_setting_id_${id}`);
	}

	/**
	 * Method that refreshes the capability value once. If you want to poll this value please use
	 * the parameter getOpts.pollInterval at {@link ZwaveDevice#registerCapability}
	 * @param {String} capabilityId, the string id of the Homey capability
	 * @param {String} commandClassId, the Z-Wave command class used for this request
   * @returns {Promise<unknown>}
	 */
	async refreshCapabilityValue(capabilityId, commandClassId) {
		return this._getCapabilityValue(capabilityId, commandClassId);
	}

	/**
	 * Prints oneliner node summary, e.g. firmware information and device identifiers.
	 */
	printNodeSummary() {
		let logSummary = `Node: ${this.node.nodeId}`;
		if (this._hasProp(this.node, 'manufacturerId') && this._hasProp(this.node.manufacturerId, 'value')) {
			logSummary += ` | Manufacturer id: ${this.node.manufacturerId.value}`
		}
		if (this._hasProp(this.node, 'productTypeId') && this._hasProp(this.node.productTypeId, 'value')) {
			logSummary += ` | ProductType id: ${this.node.productTypeId.value}`
		}
		if (this._hasProp(this.node, 'productId') && this._hasProp(this.node.productId, 'value')) {
			logSummary += ` | Product id: ${this.node.productId.value}`
		}
		if (this._hasProp(this.getSettings(), 'zw_application_version') && this._hasProp(this.getSettings(), 'zw_application_sub_version')) {
			logSummary += ` | Firmware Version: ${this.getSetting('zw_application_version')}.${this.getSetting('zw_application_sub_version')}`
		}
		if (this._hasProp(this.getSettings(), 'zw_hardware_version')) {			
			logSummary += ` | Hardware Version: ${this.getSetting('zw_hardware_version')}`
		}
		if (this._hasProp(this.node, 'firmwareId')) {
			logSummary += ` | Firmware id: ${this.node.firmwareId}`
		}
		// Loop additional firmware targets
		let i = 1;
		Object.keys(this.getSettings())
			.filter(key => key.includes('zw_application_version_'))
			.forEach(key => {
				logSummary += ` | Firmware Version Target ${1}: ${this.getSetting(`zw_application_version_${i}`)}.${this.getSetting(`zw_application_sub_version_${i}`)}`
				i++;
			});

		if (this._hasProp(this.getSettings(), 'zw_secure')) {
			logSummary += ` | Secure: ${this.getSetting('zw_secure')}`
		}

		logSummary += ` | Battery: ${this.node.battery}`

		this.log(logSummary);
	}

	/**
	 * Print the current Node information with Command Classes and their versions
	 */
	printNode() {
		this.log('------------------------------------------');

		// log the entire Node		
		this.log('Node:', this.node.nodeId);
		if (this._hasProp(this.node, 'manufacturerId') && this._hasProp(this.node.manufacturerId, 'value')) {
			this.log('- Manufacturer id:', this.node.manufacturerId.value);
		}
		if (this._hasProp(this.node, 'productTypeId') && this._hasProp(this.node.productTypeId, 'value')) {
			this.log('- ProductType id:', this.node.productTypeId.value);
		}
		if (this._hasProp(this.node, 'productId') && this._hasProp(this.node.productId, 'value')) {
			this.log('- Product id:', this.node.productId.value);
		}
		if (this._hasProp(this.getSettings(), 'zw_application_version') && this._hasProp(this.getSettings(), 'zw_application_sub_version')) {
			this.log('- Firmware Version:', `${this.getSetting('zw_application_version')}.${this.getSetting('zw_application_sub_version')}`);
		}
		if (this._hasProp(this.getSettings(), 'zw_hardware_version')) {			
			this.log('- Hardware Version:', this.getSetting('zw_hardware_version'));
		}
		if (this._hasProp(this.node, 'firmwareId')) {
			this.log('- Firmware id:', this.node.firmwareId);
		}
		// Loop additional firmware targets
		let i = 1;
		Object.keys(this.getSettings())
			.filter(key => key.includes('zw_application_version_'))
			.forEach(key => {
				this.log(`- Firmware Version Target ${1}:`, `${this.getSetting(`zw_application_version_${i}`)}.${this.getSetting(`zw_application_sub_version_${i}`)}`);
				i++;
			});

		if (this._hasProp(this.getSettings(), 'zw_secure')) {
			this.log('- Secure:', this.getSetting('zw_secure'))
		}

		this.log('- Battery:', this.node.battery);
		
		this.log('- DeviceClassBasic:', this.node.deviceClassBasic);
		this.log('- DeviceClassGeneric:', this.node.deviceClassGeneric);
		this.log('- DeviceClassSpecific:', this.node.deviceClassSpecific);
		this.log('- Token:', this.getData().token);

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
				this.log('- DeviceClassGeneric:', this.node.MultiChannelNodes[multiChannelNodeId].deviceClassGeneric);

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
	}

	/**
	 * Enable debug logging on this device. Logs all incoming reports.
	 */
	enableDebug() {
		super.enableDebug();

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
	
	/**
	 * Utility method to check if an object has a property.
	 * @param {*} object 
	 * @param {*} prop 
	 */
	_hasProp(object, prop) {
		return object && Object.prototype.hasOwnProperty.call(object, prop);
	}
}

module.exports = ZwaveDevice;
