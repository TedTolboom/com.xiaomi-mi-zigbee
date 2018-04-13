'use strict';

const events = require('./events.json');

module.exports = payload => {
	
	let eventNotificationType = payload['Notification Type (Raw)'];	
	if( Buffer.isBuffer(eventNotificationType) && eventNotificationType.length )
		eventNotificationType = eventNotificationType[0].toString()
		
	let eventCode = payload['Event (Raw)'];
	if( Buffer.isBuffer(eventCode) && eventCode.length )
		eventCode = eventCode[0].toString()
		
	if( events[ eventNotificationType ]
	 && events[ eventNotificationType ][ eventCode ] ) {
	 	
	 	let name = null;
		if( events[ eventNotificationType ][ eventCode ].name ) {
			name = events[ eventNotificationType ][ eventCode ].name
		} else if( events[ eventNotificationType ][ eventCode ].push ) {
			name = events[ eventNotificationType ][ eventCode ].push
		} else if( events[ eventNotificationType ][ eventCode ].pull ) {
			name = events[ eventNotificationType ][ eventCode ].pull
		}

		payload['Event (Parsed 2)'] = name;
	}
	
	return payload;
	
}