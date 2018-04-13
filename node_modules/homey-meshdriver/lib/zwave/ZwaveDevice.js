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
			en: 'Settings will be saved during the next wakeup of this battery device.',
			nl: 'Instelling zullen worden opgeslagen bij volgende wakeup van dit apparaat.',
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
	 * Remove all listeners and intervals from node
	 */
	onDeleted() {
		super.onDeleted();

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
	 * Method that refreshes the capability value once. If you want to poll this value please use
	 * the parameter getOpts.pollInterval at {@link ZwaveDevice#registerCapability}
	 * @param {String} capabilityId, the string id of the Homey capability
	 * @param {String} commandClassId, the Z-Wave command class used for this request
	 */
	refreshCapabilityValue(capabilityId, commandClassId) {
		return this._getCapabilityValue(capabilityId, commandClassId);
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
				this._setPollInterval(
					this._pollIntervalsKeys[changedKey].capabilityId,
					this._pollIntervalsKeys[changedKey].commandClassId,
					newValue
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
		if (this.node.battery === true && this.node.online === false) saveMessage = i18n.settings.offlineNodeSaveMessage;
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

				return new Promise.reject(new Error('missing_valid_zwave_setting_object'));
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
		let parser,
			customParser;

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
			if (this.node.battery === false) this._getCapabilityValue(capabilityId, commandClassId);
			else this.error('do not use getOnStart for battery devices, use getOnOnline instead');
		}

		// Perform get on online, also when device is initing and device is still online (replacing the getOnStart
		// functionality)
		if (capabilityGetObj.opts.getOnOnline) {

			// Get immediately if node is still online (right after pairing for example)
			if (this.node.battery === true && this.node.online === true) {
				this.log(`Node online, getting commandClassId '${commandClassId}' for capabilityId '${capabilityId}'`);
				this._getCapabilityValue(capabilityId, commandClassId);
			}

			// Bind online listener for future events
			this.node.on('online', online => {
				if (online) {
					this.log(`Node online, getting commandClassId '${commandClassId}' for capabilityId '${capabilityId}'`);
					this._getCapabilityValue(capabilityId, commandClassId);
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
				const commandSetPromise = command.call(command, parsedPayload);
				if (this.node.battery === true && this.node.online === false) return Promise.resolve('TRANSMIT_QUEUED');
				return commandSetPromise;
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

		this.setCapabilityValue(capabilityId, parsedPayload);

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
	 * @param {Number|String} [opts.getOpts.pollInterval] - Interval (in ms) to poll with a GET request. When provided a string, the device's setting with the string as ID will be used (e.g. `poll_interval`)
	 * @param {Number} [opts.getOpts.pollMultiplication] - Multiplication factor for the pollInterval key, must be a number. (e.g. 1000 to convert to seconds, 60.000 for minutes, 3600000 for hours)
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

		// Check if device has the command class we're trying to register, if not, abort
		if (typeof this.node.CommandClass[`COMMAND_CLASS_${commandClassId}`] === 'undefined') {
			return this.error('Invalid commandClass:', commandClassId);
		}

		// register the Z-Wave capability listener
		this._capabilities[capabilityId] = this._capabilities[capabilityId] || {};
		this._capabilities[capabilityId][commandClassId] = this._capabilities[capabilityId][commandClassId] || {};

		// merge systemOpts & userOpts
		let systemOpts = {};
		try {

			// First try get device class specific system capability
			systemOpts = this._getDeviceClassSpecificSystemCapability(capabilityId, commandClassId);

			// If not available use general system capability
			if (!systemOpts) systemOpts = require(`./system/capabilities/${capabilityId}/${commandClassId}.js`);

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
	 * Method that will check if the node has the provided command class
	 * @param {string} commandClassId - For example: SWITCH_BINARY
	 * @returns {boolean}
	 */
	hasCommandClass(commandClassId) {
		return !(typeof this.node.CommandClass[`COMMAND_CLASS_${commandClassId}`] === 'undefined');
	}

	getCommandClass(commandClassId) {
		if (!this.hasCommandClass(commandClassId)) return new Error(`missing_command_class_${commandClassId}`);
		return this.node.CommandClass[`COMMAND_CLASS_${commandClassId}`];
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
