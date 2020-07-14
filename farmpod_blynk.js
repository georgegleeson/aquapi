var blynkLib = require('blynk-library');
var sensorLib = require('node-dht-sensor'); 
const sensor = require('ds18b20-raspi'); 
var Gpio = require('onoff').Gpio;

//var level = new Gpio(17, 'in', 'both');
//var valv = 1;
var AUTH = '0UFQC7MtjGKVZ5zr9O6Up5fDLAsrgVRJ';

// Setup Blynk
var blynk = new blynkLib.Blynk(AUTH);

// Setup sensor, exit if failed
var highslide = 8;
var lowslide = 10;
var pumps = 0;
var drains = 10;
var sensorType = 11; // 11 for DHT11, 22 for DHT22 and AM2302
var sensorPin  = 2;  // The GPIO pin number for sensor signal
if (!sensorLib.initialize(sensorType, sensorPin)) {
    console.warn('Failed to initialize sensor');
    process.exit(1);
}
var terminal = new blynk.WidgetTerminal(9);

var v0 = new blynk.VirtualPin(0);
var v1 = new blynk.VirtualPin(1);
var v8 = new blynk.VirtualPin(8);
var v10 = new blynk.VirtualPin(10);
var v11 = new blynk.VirtualPin(11);

var count = 0;
var state = 1;
var drain = 1;

//var Gpio = require('onoff').Gpio;

relay1 = new Gpio(23, 'out');
relay2 = new Gpio(24, 'out');

relay1.write(1);
relay2.write(1);

terminal.write("Setup Complete");
console.warn("Setup Complete");
// Automatically update sensor value every 2 seconds
setInterval(function() {
    try {
	var readout = sensorLib.read();
	blynk.virtualWrite(7, readout.temperature.toFixed(1));
	blynk.virtualWrite(6, readout.humidity.toFixed(1));
	const tempC = sensor.readSimpleC();
	blynk.virtualWrite(8, tempC);
    } catch(e) {
        terminal.write(e);
	blynk.notify(e);
    }
}, 2000);

//level.watch(function (err, valv) {
  //  if (err) {
    //    terminal.write(err);
    //return;
    //}
    //blynk.virtualWrite(5, valv);
//});


v0.on('write', function(param) {
    highslide = param[0];
});

v1.on('write', function(param) {
    lowslide = param[0];
});

v11.on('write', function(param) {
    pumps = param[0];
});

v10.on('write', function(param) {
    drains = param[0];
});

setInterval(function() {
    try {
	terminal.write('Pump Function Running \n'); 
	if (pumps == 1) {
	    terminal.write('Pumps are on \n');
	    count = count + 1;
	    if (drain == 1) {
	        terminal.write('Draining \n');
	        relay2.write(0);
                blynk.virtualWrite(3, 1023);
	        if (count == 60*drains) {
		    drain = 0;
		    relay2.write(1);
                    blynk.virtualWrite(3, 0);
		    relay1.write(0);
		    blynk.virtualWrite(4, 1023);
		    count = 0;
		    terminal.write('Drained \n');
		    terminal.write('High Pump Started \n');
	        }
	    }

	    else if (count == 60*highslide && state == 1) {
	        state = 0;
	        count = 0;
	        relay1.write(1);
	        blynk.virtualWrite(4, 0);
	        relay2.write(0);
	        blynk.virtualWrite(3, 1023);
	        terminal.write('Low Pump Started \n');
	    }

	    else if (count == 60*lowslide && state == 0) { 
	        state = 1;
	        count = 0;
	        relay2.write(1);
	        blynk.virtualWrite(3, 0);
	        relay1.write(0);
	        blynk.virtualWrite(4, 1023);
	        terminal.write('High Pump Started \n');
	    }
        }

        if (pumps == 0) {
	    terminal.write('Pumps Off \n');
	    relay1.write(1);
	    blynk.virtualWrite(4, 0);
	    relay2.write(1);
	    blynk.virtualWrite(3, 0);
	    drain = 1;
	    count = 0;
        }
    } catch(e) {
	temrinal.write(e)
	blynk.notify(e);
    }

}, 1000);

