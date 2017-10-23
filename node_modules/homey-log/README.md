# homey-log

This module can be plugged into a Homey app to send logs to [Sentry](http://sentry.io/).

## Installation

```
npm install homey-log
```

## Usage

In your `env.json`, add your Sentry URL:

```javascript
{
	"HOMEY_LOG_URL": "https://foo:bar@sentry.io/123456"
}
```

In your app.js, include the library:

```javascript
const Log = require('homey-log').Log;
...
throw new Error("Whoops");
```

### Notes

* When your app crashes due to an uncaughtException, this will automatically be sent to Sentry.
* As of Homey v1.0.3, when running your app using `athom project --run`, logging is disabled.

### Methods

#### Log.init( String url );
Set the URL manually, when not provided using your `env.json`. Not recommended due to security!

#### Log.setTags( Object tags );
Set a custom object of 'tags'. Tags that are already set are `appId`, `appVersion` and `homeyVersion`

#### Log.setExtra( Object extra );
Set a custom object of 'extra' parameters

#### Log.setUser( Object user );
Set a custom object of 'user' data - do not include sensitive data!

#### Log.captureMessage( String message )
Send a message to Sentry

#### Log.captureException( Error err )
Send an Error object to Sentry
