'use strict';

const Homey = require('homey');
const MeshDevice = require('../MeshDevice.js');

// TODO battery node online event

/**
 * @extends MeshDevice
 */
class ZigBeeDevice extends MeshDevice {

	/*
	 *	Homey methods
	 */

	/**
	 * @private
	 */
	onInit() {
		super.onInit('zigbee');

		this._capabilities = {};
		this._settings = {};
		this._reportListeners = {};
		this._attrReportListeners = {};
		this._pollIntervals = {};
		this._pollIntervalsKeys = {};
		this._bindRequests = [];
		this._configureReportRequests = [];

		this.once('__meshInit', () => {
			this.log('ZigBeeDevice has been inited');
			this.onMeshInit && this.onMeshInit();
			this._initReportListener();
		});
	}

	/*
	 * Private methods
	 */

	/**
	 * @private
	 */
	_initReportListener() {

		// Start listening for incoming reports
		this.node.on('report', report => {
			if (report && report.event === 'report') {
				const clusterEndpointId = `${Number(report.endpoint) - 1}_${report.cluster}`;
				if ((this._attrReportListeners[clusterEndpointId] && this._attrReportListeners[clusterEndpointId][report.attr])) {
					this._attrReportListeners[clusterEndpointId][report.attr](report.value);
				}
			}
		});
	}

	/**
	 * @private
	 */
	_registerCapabilityGet(capabilityId, clusterId) {

		const capabilityGetObj = this._getCapabilityObj('get', capabilityId, clusterId);
		if (capabilityGetObj instanceof Error) return capabilityGetObj;

		// get initial value on start if null, unless it's an offline battery device and the getOnOnline flag is also set
		if (capabilityGetObj.opts.getOnStart
			&& this.getCapabilityValue(capabilityId) === null
			&& !(this.node.battery && this.node.online === false && capabilityGetObj.opts.getOnOnline === true)) {
			this._getCapabilityValue(capabilityId, clusterId);
		}

		if (capabilityGetObj.opts.getOnOnline) {
			this.node.on('online', () => {
				this._debug(`Node online, getting clusterId '${clusterId}' for capabilityId '${capabilityId}'`);
				this._getCapabilityValue(capabilityId, clusterId);
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
					clusterId,
				};
			}

			this._setPollInterval(capabilityId, clusterId, pollInterval);
		}
	}

	/**
	 * @private
	 */
	_setPollInterval(capabilityId, clusterId, pollInterval) {

		this._pollIntervals[capabilityId] = this._pollIntervals[capabilityId] || {};

		if (this._pollIntervals[capabilityId][clusterId]) {
			clearInterval(this._pollIntervals[capabilityId][clusterId]);
		}

		if (pollInterval < 1) return;

		this._pollIntervals[capabilityId][clusterId] = setInterval(() => {
			this._debug(`Polling clusterId '${clusterId}' for capabilityId '${capabilityId}'`);
			this._getCapabilityValue(capabilityId, clusterId);
		}, pollInterval);

	}

	/**
	 * @private
	 */
	async _getCapabilityValue(capabilityId, clusterId) {

		const capabilityGetObj = this._getCapabilityObj('get', capabilityId, clusterId);
		if (capabilityGetObj instanceof Error) return capabilityGetObj;

		let parsedPayload = {};

		if (typeof capabilityGetObj.parser === 'function') {
			parsedPayload = await capabilityGetObj.parser.call(this);
			if (parsedPayload instanceof Error) return this.error(parsedPayload);
		}

		try {
			const cluster = capabilityGetObj.node.endpoints[capabilityGetObj.endpoint].clusters[capabilityGetObj.clusterId];
			return cluster.read(capabilityGetObj.commandId)
				.then(res => this._onReport(capabilityId, capabilityGetObj.clusterId, res))
				.catch(err => this.error(err));
		} catch (err) {
			return this.error(err);
		}
	}

	/**
	 * @private
	 */
	_registerCapabilitySet(capabilityId, clusterId) {

		const capabilitySetObj = this._getCapabilityObj('set', capabilityId, clusterId);
		if (capabilitySetObj instanceof Error) return capabilitySetObj;

		this.registerCapabilityListener(capabilityId, async (value, opts) => {
			return await this._registerCapabilityListenerHandler(capabilitySetObj, capabilityId, value, opts);
		});
	}

	/**
	 * @param capabilitiesOpts
	 * @private
	 */
	_registerCapabilitiesSet(capabilitiesOpts, fn) {

		// Register multiple capabilities with a debouncer
		this.registerMultipleCapabilityListener(capabilitiesOpts.map(x => x.capability), async (valueObj, optsObj) => {

			// Let the app try to handle the debounced capabilities updates
			const result = await fn(valueObj, optsObj);

			// If it did not handle it for some reason, return to the defaults
			if (!result || result instanceof Error) {

				// Loop all changed capabilities
				for (const capabilityId of Object.keys(valueObj)) {
					const capabilityObj = capabilitiesOpts.find(x => x.capability = capabilityId);
					const clusterId = capabilityObj.cluster;
					const value = valueObj[capabilityId];
					const opts = optsObj[capabilityId];

					// Try and get capability set object
					const capabilitySetObj = this._getCapabilityObj('set', capabilityId, clusterId);
					if (capabilitySetObj instanceof Error) {
						this.error(`capabilitySetObj ${capabilityId} ${clusterId} is error`, capabilitySetObj);
						break;
					}

					// Try to handle executing the capability change event
					try {
						await this._registerCapabilityListenerHandler(capabilitySetObj, capabilityId, value, opts);
					} catch (err) {
						this.error('_registerCapabilityListenerHandler() -> failed', err);
						break;
					}
				}
			}
		}, 500);
	}

	/**
	 * @param capabilitySetObj
	 * @param capabilityId
	 * @param value
	 * @param opts
	 * @returns {Promise.<*>}
	 * @private
	 */
	async _registerCapabilityListenerHandler(capabilitySetObj, capabilityId, value, opts) {
		this.log(`set ${capabilityId} -> ${value}`);
		if (typeof capabilitySetObj.parser !== 'function') return Promise.reject(new Error('parser_is_not_a_function'));

		let commandId = capabilitySetObj.commandId;
		if (typeof capabilitySetObj.commandId === 'function') commandId = capabilitySetObj.commandId(value, opts);
		let parsedPayload = await capabilitySetObj.parser.call(this, value, opts);
		if (parsedPayload instanceof Error) return Promise.reject(parsedPayload);
		if (parsedPayload === null) return Promise.resolve();

		try {
			const cluster = capabilitySetObj.node.endpoints[capabilitySetObj.endpoint].clusters[capabilitySetObj.clusterId];
			return cluster.do(commandId, parsedPayload)
				.catch(err => {
					this.error(`Error: could not perform ${commandId} on ${capabilitySetObj.clusterId}`, err);
					throw err;
				});
		} catch (err) {
			return Promise.reject(err);
		}
	}

	/**
	 * @param capabilityId
	 * @param clusterId
	 * @param userOpts
	 * @private
	 */
	_mergeSystemAndUserOpts(capabilityId, clusterId, userOpts) {

		// Merge systemOpts & userOpts
		let systemOpts = {};
		try {
			systemOpts = Homey.util.recursiveDeepCopy(require(`./system/capabilities/${capabilityId}/${clusterId}.js`));

			// Bind correct scope
			for (let i in systemOpts) {
				if (systemOpts.hasOwnProperty(i) && typeof systemOpts[i] === 'function') {
					systemOpts[i] = systemOpts[i].bind(this);
				}
			}
		} catch (err) {
			if (err.code !== 'MODULE_NOT_FOUND' || err.message.indexOf(`/system/capabilities/${capabilityId}/${clusterId}.js`) < 0) {
				process.nextTick(() => {
					throw err;
				});
			}
		}

		// Insert default endpoint zero
		if (userOpts && !userOpts.hasOwnProperty('endpoint')) userOpts.endpoint = this.getClusterEndpoint(clusterId);
		else if (typeof userOpts === 'undefined') userOpts = { endpoint: this.getClusterEndpoint(clusterId) };

		this._capabilities[capabilityId][clusterId] = Object.assign(
			systemOpts || {},
			userOpts || {}
		);
	}

	/**
	 * @private
	 */
	async _onReport(capabilityId, clusterId, payload) {

		const capabilityReportObj = this._getCapabilityObj('report', capabilityId, clusterId);
		if (capabilityReportObj instanceof Error) return capabilityReportObj;

		if (typeof capabilityReportObj.parser !== 'function') return;

		const parsedPayload = await capabilityReportObj.parser.call(this, payload);
		if (parsedPayload instanceof Error) return;
		if (parsedPayload === null) return;

		this.setCapabilityValue(capabilityId, parsedPayload);

		return parsedPayload;
	}

	/**
	 * @private
	 */
	_getCapabilityObj(commandType, capabilityId, clusterId) {

		const capability = this._capabilities[capabilityId];
		let cluster;

		if (typeof clusterId !== 'undefined') {
			cluster = capability[clusterId];
		} else {
			return new Error('missing_zigbee_cluster_id');
		}

		if (typeof cluster === 'undefined') return new Error('missing_zigbee_capability');
		const commandId = cluster[commandType];
		const parser = cluster[`${commandType}Parser`] || null;
		const opts = cluster[`${commandType}Opts`] || {};
		const node = this.node;

		if (typeof commandId === 'string' || typeof commandId === 'function') {
			return {
				clusterId,
				commandId,
				endpoint: cluster.endpoint,
				parser,
				opts,
				node,
			};
		}

		return new Error(`capability_${commandType}_is_not_a_function_or_string`);
	}

	/*
	 * Public methods
	 */

	/**
	 * Register a Homey Capability with a Cluster.
	 * @param {string} capabilityId - The Homey capability id (e.g. `onoff`)
	 * @param {string} clusterId - The Cluster id (e.g. `genBasic`)
	 * @param {Object} [userOpts] - The object with options for this capability/cluster combination. These will extend system options, if available (`/lib/zigbee/system/`)
	 * @param {string} [userOpts.get] - The command to get a value (e.g. `onOff`)
	 * @param {string} [userOpts.getParser] - The function that is called when a GET request is made. Should return an Object.
	 * @param {Object} [userOpts.getOpts
	 * @param {Boolean} [userOpts.getOpts.getOnStart] - Get the value on App start
	 * @param {Boolean} [userOpts.getOpts.getOnOnline] - Get the value when the device is marked as online
	 * @param {Number|string} [userOpts.getOpts.pollInterval] - Interval to poll with a GET request. When provided a string, the device's setting with the string as ID will be used (e.g. `poll_interval`)
	 * @param {string} [userOpts.set] - The command to set a value (e.g. `on`)
	 * @param {Function} [userOpts.setParser] - The function that is called when a SET request is made. Should return an Object.
	 * @param {*} [userOpts.setParser.value] - The value of the Homey capability
	 * @param {Object} [userOpts.setParser.opts] - Options for the capability command
	 * @param {string} [userOpts.report] - The command to report a value (e.g. `onOff`)
	 * @param {Function} [userOpts.reportParser] - The function that is called when a REPORT request is made. Should return an Object.
	 * @param {Object} [userOpts.reportParser.report] - The report object
	 * @param {number} [userOpts.endpoint=0] - An index to identify the endpoint to use for this capability
	 */
	registerCapability(capabilityId, clusterId, userOpts) {

		// Register the ZigBee capability listener
		this._capabilities[capabilityId] = this._capabilities[capabilityId] || {};
		this._capabilities[capabilityId][clusterId] = this._capabilities[capabilityId][clusterId] || {};

		// Merge systemOpts & userOpts
		this._mergeSystemAndUserOpts(capabilityId, clusterId, userOpts);

		// Register get/set
		this._registerCapabilitySet(capabilityId, clusterId);
		this._registerCapabilityGet(capabilityId, clusterId);
	}

	/**
	 * Register multiple Homey Capabilities with a Cluster. When a capability is changed, the event will be debounced
	 * with the other capabilities in the capabilitiesOpts array.
	 * @param {Object[]} capabilitiesOpts
	 * @param {string} capabilitiesOpts.capability
	 * @param {string} capabilitiesOpts.cluster
	 * @param {Object} [capabilitiesOpts.opts] - The object with options for this capability/cluster combination. These will extend system options, if available (`/lib/zigbee/system/`)
	 * @param {string} [capabilitiesOpts.opts.get] - The command to get a value (e.g. `onOff`)
	 * @param {string} [capabilitiesOpts.opts.getParser] - The function that is called when a GET request is made. Should return an Object.
	 * @param {Object} [capabilitiesOpts.opts.getOpts]
	 * @param {Boolean} [capabilitiesOpts.opts.getOpts.getOnStart] - Get the value on App start
	 * @param {Boolean} [capabilitiesOpts.opts.getOpts.getOnOnline] - Get the value when the device is marked as online
	 * @param {Number|string} [capabilitiesOpts.opts.getOpts.pollInterval] - Interval to poll with a GET request. When provided a string, the device's setting with the string as ID will be used (e.g. `poll_interval`)
	 * @param {string} [capabilitiesOpts.opts.set] - The command to set a value (e.g. `on`)
	 * @param {Function} [capabilitiesOpts.opts.setParser] - The function that is called when a SET request is made. Should return an Object.
	 * @param {*} [capabilitiesOpts.opts.setParser.value] - The value of the Homey capability
	 * @param {Object} [capabilitiesOpts.opts.setParser.opts] - Options for the capability command
	 * @param {string} [capabilitiesOpts.opts.report] - The command to report a value (e.g. `onOff`)
	 * @param {Function} [capabilitiesOpts.opts.reportParser] - The function that is called when a REPORT request is made. Should return an Object.
	 * @param {Object} [capabilitiesOpts.opts.reportParser.report] - The report object
	 * @param {number} [capabilitiesOpts.opts.endpoint=0] - An index to identify the endpoint to use for this capability
	 * @param {function} fn
	 */
	registerMultipleCapabilities(capabilitiesOpts = [], fn) {

		// Loop all provided capabilities
		capabilitiesOpts.forEach(capabilityObj => {
			const capabilityId = capabilityObj.capability;
			const clusterId = capabilityObj.cluster;
			let userOpts = capabilityObj.opts || {};

			// Register the ZigBee capability listener
			this._capabilities[capabilityId] = this._capabilities[capabilityId] || {};
			this._capabilities[capabilityId][clusterId] = this._capabilities[capabilityId][clusterId] || {};

			// Override default system opts with user opts
			this._mergeSystemAndUserOpts(capabilityId, clusterId, userOpts);

			// Register capability getter
			this._registerCapabilityGet(capabilityId, clusterId);

			// Register debounced capabilities set
			this._registerCapabilitiesSet(capabilitiesOpts, fn);
		});
	}

	/**
	 * Method that searches for the first occurrence of a clusterName in a device's endpoints and returns the endpoint id.
	 * @param {string} clusterName
	 */
	getClusterEndpoint(clusterName) {
		if (typeof clusterName !== 'string') return new Error('invalid_cluster_name');
		if (!this.node || !this.node.hasOwnProperty('endpoints')) return new Error('node_not_initialized');

		// Loop all endpoints for first occurence of clusterName
		for (const endpoint of this.node.endpoints) {
			if (endpoint.clusters.hasOwnProperty(clusterName)) {
				return this.node.endpoints.indexOf(endpoint);
			}
		}

		// Not found, probably something wrong, return default
		return 0;
	}

	/**
	 * Register a endpoint command listener, which is called when a command has been received from the provided endpoint
	 * cluster combination.
	 * @param {string} clusterId - The ID of the cluster (e.g. `genBasic`)
	 * @param {string} commandId - The ID of the Command (e.g. `onOff`)
	 * @param {Function} triggerFn
	 * @param {Object} triggerFn.rawReport - The raw report
	 * @param {Object} triggerFn.parsedReport - The parsed report (parsed by the first available `reportParser` method)
	 * @param {number} [endpointId=0] - The endpoint index (e.g. 0)
	 */
	registerReportListener(clusterId, commandId, triggerFn, endpointId = 0) {
		const reportId = `${endpointId}_${clusterId}_${commandId}`;
		const clusterEndpointId = `${endpointId}_${clusterId}`;

		const alreadyBound = this.getStoreValue(reportId);
		const alreadyRegistered = Object.keys(this._reportListeners[clusterEndpointId] || {}).length > 0;

		this._reportListeners[clusterEndpointId] = this._reportListeners[clusterEndpointId] || {};
		this._reportListeners[clusterEndpointId][commandId] = triggerFn;

		// Make sure to only bind each cluster once
		if (alreadyBound || alreadyRegistered) {
			this.log('registerReportListener() -> already bound cluster', clusterId, commandId, endpointId);

			// Lister on this cluster for specific commands
			this.node.on('command', command => {
				const endpointId = command.endpoint;
				if (!endpointId) this.error('command missing endpoint id', command);
				const commandClusterEndpointId = `${endpointId}_${clusterId}`;
				if (this._reportListeners[commandClusterEndpointId]
					&& this._reportListeners[commandClusterEndpointId][command.attr]
					&& commandId === command.attr) {
					this._reportListeners[commandClusterEndpointId][command.attr](command.value);
				}
			});
		} else {

			this.log('registerReportListener() -> bind cluster', clusterId, commandId, endpointId);

			// Add to queue
			this._bindRequests.push({ endpointId, clusterId, commandId, reportId });

			// If not already binding start the binding process
			if (!this.bindingInProcess) this._bindCluster();
		}
	}

	/**
	 * Start binding process, if there are more than one bindings required perform them one after another.
	 * @returns {Promise}
	 * @private
	 */
	async _bindCluster() {

		// Mark binding true
		this.bindingInProcess = true;

		// Get next bind obj in queue
		const bindObj = this._bindRequests.shift();
		try {
			await this.node.endpoints[bindObj.endpointId].clusters[bindObj.clusterId].bind();
		} catch (err) {
			this.error(`registerReportListener() -> error could not bind ${bindObj.clusterId} cluster on endpoint ${bindObj.endpointId}`, err);
			if (this._bindRequests.length > 0) return this._bindCluster();
			else this.bindingInProcess = false;
			return;
		}

		this.log(`registerReportListener() -> bind ${bindObj.clusterId} on endpoint ${bindObj.endpointId} successful`);

		// Mark this cluster as bound for this device to prevent rebinding
		this.setStoreValue(bindObj.reportId, true);

		// Bind listener for incoming commands
		this.node.on('command', command => {
			const endpointId = command.endpoint;
			if (!endpointId) this.error('command missing endpoint id', command);
			const commandClusterEndpointId = `${endpointId}_${bindObj.clusterId}`;
			if (this._reportListeners[commandClusterEndpointId]
				&& this._reportListeners[commandClusterEndpointId][command.attr]
				&& bindObj.commandId === command.attr) {
				this._reportListeners[commandClusterEndpointId][command.attr](command.value);
			}
		});

		// If queue not empty continue, else mark as done
		if (this._bindRequests.length > 0) return this._bindCluster();
		else this.bindingInProcess = false;
	}

	/**
	 * Register an attribute report listener, which is called when a report has been received for the provided endpoint
	 * cluster and attribute combination.
	 * @param {string} clusterId - The ID of the cluster (e.g. `genBasic`)
	 * @param {string} attrId - The ID of the attribute (e.g. `onOff`)
	 * @param {number} minInt - The minimal reporting interval in seconds (e.g. 10 (seconds))
	 * @param {number} maxInt - The maximal reporting interval in seconds (e.g. 300 (seconds))
	 * @param {number} repChange - Reportable change; the attribute should report its value when the value is changed more than this setting, for attributes of analog data type this argument is mandatory.
	 * @param {Function} triggerFn - Function that will be called when attribute report data is received
	 * @param {number} [endpointId=0] - The endpoint index (e.g. 0)
	 * @returns {Promise} Resolves if configuration succeeded
	 */
	async registerAttrReportListener(clusterId, attrId, minInt, maxInt, repChange = null, triggerFn, endpointId = 0) {
		const reportId = `attrReport_${endpointId}_${clusterId}_${attrId}`;
		const clusterEndpointId = `${endpointId}_${clusterId}`;

		// minInt must be greater than or equal to 1
		if (minInt < 1) throw new Error('invalid_min_int_report_value');

		// maxInt must be larger than 60 and larger than minInt or 0
		if (maxInt !== 0 && (maxInt < 60 || maxInt < minInt)) {
			throw new Error('invalid_max_int_report_value');
		}

		// Check if endpoint cluster combi exists
		if (!this.node.endpoints[endpointId] || !this.node.endpoints[endpointId].clusters[clusterId]) {
			throw new Error('invalid_endpoint_cluster_combination');
		}

		// Check if already configured
		const alreadyConfigured = this.getStoreValue(reportId);
		this._attrReportListeners[clusterEndpointId] = this._attrReportListeners[clusterEndpointId] || {};

		// Store callback
		this._attrReportListeners[clusterEndpointId][attrId] = triggerFn;

		// Make sure to configure just once
		if (alreadyConfigured &&
			alreadyConfigured.minInt === minInt &&
			alreadyConfigured.maxInt === maxInt &&
			alreadyConfigured.repChange === repChange) {
			this.log(`registerAttrReportListener() -> already configured attr reporting ${reportId}`);
			return true;
		} else {

			// If was registered before unregister it first
			this.unsetStoreValue(reportId);

			return new Promise((resolve, reject) => {
				// Add to queue
				this._configureReportRequests.push({
					reportId,
					endpointId,
					clusterId,
					attrId,
					minInt,
					maxInt,
					repChange,
					promise: { resolve, reject }
				});

				// If not already binding start the binding process
				if (!this.configureReportInProcess) this._configureReport();
			})
		}
	}

	/**
	 * Start report configuring process, if there are more than one configurations required perform them one after another.
	 * @returns {Promise}
	 * @private
	 */
	async _configureReport() {

		// Mark configuring true
		this.configureReportInProcess = true;

		// Get next configure obj in queue
		const configureReportObj = this._configureReportRequests.shift();

		try {
			await this.node.endpoints[configureReportObj.endpointId].clusters[configureReportObj.clusterId]
				.report(configureReportObj.attrId, configureReportObj.minInt, configureReportObj.maxInt, configureReportObj.repChange);

			this.log(`registerAttrReportListener() -> configured attr reporting ${configureReportObj.reportId}`);

			// Store configuration succeeded
			this.setStoreValue(configureReportObj.reportId, {
				minInt: configureReportObj.minInt,
				maxInt: configureReportObj.maxInt,
				repChange: configureReportObj.repChange,
			});

			if (configureReportObj.promise) configureReportObj.promise.resolve();
		} catch (err) {
			this.error(`registerAttrReportListener() -> error could not configure ${configureReportObj.reportId}`, err);
			if (configureReportObj.promise) configureReportObj.promise.reject(err);
		}

		// If queue not empty continue, else mark as done
		if (this._configureReportRequests.length > 0) return this._configureReport();
		else this.configureReportInProcess = false;
	}

	/**
	 * Print the current Node information with Endpoints and Clusters
	 */
	printNode() {
		this.log('------------------------------------------');

		// log the entire Node
		this.log('Node:', this.getData().token);
		this.log('- Battery:', this.node.battery);

		Object.keys(this.node.endpoints).forEach(endpointsId => {
			this.log('- Endpoints:', endpointsId);
			this.log('-- Clusters:');
			Object.keys(this.node.endpoints[endpointsId].clusters).forEach(key => {
				this.log('---', key);
				if (typeof this.node.endpoints[endpointsId].clusters[key].attrs !== 'undefined') {
					Object.keys(this.node.endpoints[endpointsId].clusters[key].attrs).forEach(attrKey => {
						this.log('----', attrKey, ':', this.node.endpoints[endpointsId].clusters[key].attrs[attrKey]);
					});
				}
			});
		});

		this.log('------------------------------------------');
	}
}

module.exports = ZigBeeDevice;
