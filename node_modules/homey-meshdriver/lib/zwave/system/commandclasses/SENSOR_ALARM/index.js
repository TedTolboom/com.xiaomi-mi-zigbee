'use strict';

module.exports = payload => {
	
	let alarms = {
		'0': 'General Purpose Alarm',
		'1': 'Smoke Alarm',
		'2': 'CO Alarm',
		'3': 'CO2 Alarm',
		'4': 'Heat Alarm',
		'5': 'Water Leak Alarm'
	}
	
	if( typeof payload['Bit Mask'] !== 'undefined' ) {
		payload['Bit Mask (Parsed)'] = {};
	
		for( let alarmValue in alarms ) {
			payload['Bit Mask (Parsed)'][ alarms[alarmValue] ] = getBitBE( payload['Bit Mask'][0], parseInt(alarmValue) );
		}
	}
	
	return payload;
	
}

function getBitBE( value, position, size ){
	return !!((1 << position ) & value);
}