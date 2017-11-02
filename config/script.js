'use strict';

const branches = ['production', 'beta', 'alpha'];
const branch = require('git-branch').sync();
const branchIndex = branches.indexOf(branch);

module.exports = function filterDriversByBranch(appConfig) {
	if (appConfig.drivers) {
		console.log(`Filtering drivers for branch ${branch}. Including [${branchIndex === -1 ? 'All Drivers' : branches.slice(0, branchIndex + 1).join(', ')}]`);
		appConfig.drivers = appConfig.drivers
			.filter(driver => branches.indexOf(driver.branch) >= branchIndex)
			.map(driver => {
				delete driver.branch;
				return driver;
			});
	}
	return appConfig;
};
