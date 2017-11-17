// (c) Gerhard Döppert, 2017, GNU GPL 3

var express = require('express');

var app = express();

var router = require('./router');

var cron = require('node-schedule');
var updater = require('./updater');

var s = 0;
var v = 0;

// 5 * 6 = 30

cron.scheduleJob('10-39 10 * * *', function() {
//cron.scheduleJob('19-20 19 * * *', function() {
	
	console.log('update ' + Object.entries(updater.values)[v][1] + " for " + updater.stats[s].name);
	
	updater.update(updater.stats[s].id, Object.entries(updater.values)[v][0])
	.then(function (n) {
			console.log("n: "+n);			
		}, function (e) { console.log(e);} );
	
	v++;	
	if (v >= Object.entries(updater.values).length) { v = 0; s++; }
	if (s >= updater.stats.length) { s=0; }
});

app.use(express.static('public'));

router(app);

app.listen(1337, function() {
	console.log('Server listening on port 1337');
});

