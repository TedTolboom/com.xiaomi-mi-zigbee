# Xiaomi-mi Smart Home (Zigbee)

### This app requires Homey SW release 1.5.7 or higher

This app adds support for the Zigbee Smart Home devices made by [Xiaomi Smart Home Devices](https://xiaomi-mi.com/).  
<a href="https://github.com/TedTolboom/com.xiaomi-mi-zigbee">
  <img src="https://raw.githubusercontent.com/TedTolboom/com.xiaomi-mi-zigbee/master/assets/images/small.png">
</a>  

## Links:
[Xiaomi-mi Zigbee app Athom apps](https://apps.athom.com/app/com.xiaomi-mi-zigbee)                    
[Xiaomi-mi Zigbee app Github repository](https://github.com/TedTolboom/com.xiaomi-mi-zigbee)   

**Note:** This app is using [HomeyConfig composer](https://www.npmjs.com/package/node-homey-config-composer).   
Please file Pull Requests on the *development* branch of this repository and with respect to the refactored files in _/drivers_ and _/config_ folders.   

## Supported devices (supported capabilities)
* [Door/Window sensor](https://xiaomi-mi.com/sockets-and-sensors/xiaomi-mi-door-window-sensors/) (contact alarm)
* [Occupancy Sensor](https://xiaomi-mi.com/sockets-and-sensors/xiaomi-mi-occupancy-sensor/) (motion alarm)
* [Temperature/Humidity Sensor](https://xiaomi-mi.com/sockets-and-sensors/xiaomi-mi-temperature-humidity-sensor/) (temperature, relative humidity)
* [Wireless switch](https://xiaomi-mi.com/sockets-and-sensors/xiaomi-mi-wireless-switch/) (1x - 4x click, Key Held, Key released)  
* [Smart socket plug ZigBee edition](https://xiaomi-mi.com/sockets-and-sensors/xiaomi-mi-smart-socket-plug-2-zigbee-edition-white/) (onoff, measure_power)
* [Cube](https://xiaomi-mi.com/sockets-and-sensors/xiaomi-mi-smart-home-cube-white/) (Slide, Shake, Double Tap, Rotate (**angle, relative angle**), Flip 90°, Flip 180°), see [device readme for details](https://github.com/TedTolboom/com.xiaomi-mi-zigbee/blob/master/docs/README_cube.md)

* [Aqara Window/Door Sensor](https://xiaomi-mi.com/sockets-and-sensors/xiaomi-aqara-window-door-sensor/) (contact alarm)
* [Aqara Human Body Sensor](https://xiaomi-mi.com/sockets-and-sensors/aqara-human-body-sensor/) (motion alarm, luminance)
* [Aqara Temperature and Humidity Sensor](https://xiaomi-mi.com/sockets-and-sensors/aqara-human-body-sensor/) (temperature, relative humidity, atmospheric pressure)
* [Aqara Smart Light Wall Switch Single](https://xiaomi-mi.com/sockets-and-sensors/aqara-smart-light-wall-switch-zigbee-version-single-key/) / [Double](https://xiaomi-mi.com/sockets-and-sensors/aqara-smart-light-wall-switch-zigbee-version-double-key/) (onoff)
* [Aqara Smart Socket ZigBee Version](https://xiaomi-mi.com/sockets-and-sensors/aqara-smart-socket-zigbee-version/) (onoff, measure_power)
* [Aqara Wireless switch (WXKG11LM)](https://xiaomi-mi.com/sockets-and-sensors/xiaomi-aqara-smart-wireless-switch/) (1x - 4x click)   
[Aqara Wireless switch with Gyro (WXKG12LM)](https://xiaomi-mi.com/sockets-and-sensors/xiaomi-aqara-smart-wireless-switch/) (1x, 2x click, key held, key released, Shaken)
* [Aqara Wireless Remote Switch Single](https://xiaomi-mi.com/sockets-and-sensors/aqara-smart-light-wall-switch-single-key/) / [Double](https://xiaomi-mi.com/sockets-and-sensors/remote-switch-for-aqara-smart-light-wall-switch-double-key/) (1x click for each button and combined)     

**Notes:**
* Battery operated devices will not yet show the **battery level**; this will be added in a future release (manufacturer specific ZigBee implementation)    
* The Smart socket plug and Aqara Smart Socket ZigBee version report the actual power (W), **consumed energy (kWh)** will be added in a future release (manufacturer specific ZigBee implementation)    

## Devices Work in Progress (reports received)
* Curtain Controller ([GitHub issue](https://github.com/TedTolboom/com.xiaomi-mi-zigbee/issues/30))

## Devices Work in Progress (inclusion is possible, require a [ZigBee Shepherd change (by Athom)](https://github.com/athombv/homey/issues/2005))
* MiJia Honeywell Smoke Detector White
* MiJia Honeywell Gas Leak Detector
* MiJia Aqara Water sensor

## Supported Languages:
* English
* Dutch

## Acknowledgements:
This app and driver development has been supported by:  
* Sprut666666   
* Kasteleman   
* BasKiers
* RobinBolscher

## Feedback:
Any requests please post them in the [Xiaomi-mi Zigbee topic on the Athom Forum](https://forum.athom.com/discussion/4120/) or contact me on [Slack](https://athomcommunity.slack.com/team/tedtolboom)    
Please report issues at the [issues section on Github](https://github.com/TedTolboom/com.xiaomi-mi-zigbee/issues) otherwise in the above mentioned topic.     

## Change Log:
### v 0.3.0
* Add support for Aqara Wireless switch with Gyro (product type no: WXKG12LM)   
**Note:** Switches with this type no. that were included before will need to be re-included in order to work properly   
* Replaced old scene trigger cards with autocomplete cards to fix reported issues   
**Note:** The old (marked DEPRECATED) cards will be removed in a next release; please rebuild your flows based on the new cards  
* Update ZigBee meshdriver to 1.2.12   

### v 0.2.5
* Add temperature offset correction setting for the Xiaomi temperature & humidity sensor and the Aqara temperature & humidity sensor   
* Fix typo in Xiaomi Cube flow trigger card

### v 0.2.4
* Fix issue where Aqara Wireless Remote Switch Single init results in app crash, issue [#46](https://github.com/TedTolboom/com.xiaomi-mi-zigbee/issues/46)   

### v 0.2.3
* Updated app dependency to latest Stable Homey Software release (>= 1.5.7)
* Update ZigBee meshdriver to 1.2.7   
* Add support for the Xiaomi Cube rotation angle (and relative angle) capability, fix issue [#29](https://github.com/TedTolboom/com.xiaomi-mi-zigbee/issues/29)
* Add additional ID's for Aqara Smart Light Wall Switch Single / Double, fix issue [#20](https://github.com/TedTolboom/com.xiaomi-mi-zigbee/issues/20))
* Add additional ID's for Aqara Wireless Switch, fix issue [#38](https://github.com/TedTolboom/com.xiaomi-mi-zigbee/issues/38))   
* Fix issue where unsupported options are presented in the trigger card of the Aqara Wireless Remote Switch Single, related to [#37](https://github.com/TedTolboom/com.xiaomi-mi-zigbee/issues/37)

### v 0.2.2
* Update relative link in readme.md to direct link (Homey apps compatible)   
* Update app manifest for supported Devices   

### v 0.2.1
* Add support for Xiaomi Cube (Slide, Shake, Double Tap, Rotate (action, not angle yet), Flip 90°, Flip 180°).   
**note:** Cubes included based on previous development builds need to be re-included   

### v 0.2.0
* Add support for Smart socket plug ZigBee edition (onoff, measure_power)   
* Add support for Aqara Smart Light Wall Switch Single / Double (onoff)   
* Add support for Aqara Smart Socket ZigBee Version (onoff, measure_power)   
* Add explicitly in app title dependency on Homey SW release (>= 1.5.4)   
