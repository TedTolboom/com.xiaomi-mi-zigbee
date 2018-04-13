'use strict';

module.exports = {
  get: 'instantaneousDemand',
  reportParser(value) {
    const instantaneousDemandFactor = this.instantaneousDemandFactor || 1
    if (value < 0) return;
    return value / instantaneousDemandfactor;
  },
  report: 'instantaneousDemand',
  getOpts: {
    getOnStart: true,
  },
};
