'use strict';

module.exports = payload => {
	
	if( typeof payload['Sensor Value'] != 'undefined' ) {
		try {
			payload['Sensor Value (Parsed)'] = payload['Sensor Value'].readIntBE(0, payload['Level']['Size']);
			payload['Sensor Value (Parsed)'] /= Math.pow(10, payload['Level']['Precision']);
		} catch( err ) {}
	}

	return payload;
	
}