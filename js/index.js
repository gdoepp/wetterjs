// (c) Gerhard Döppert, 2017

var express = require('express');

var app = express();

var router = require('./router');

var cron = require('node-schedule');
var updater = require('./updater');

var stats= [{id:'04928', name:'Stuttgart'},{id:'01420', name:'Frankfurt'},
	{id:'03379', name:'München'}, {id:'01975', name:'Hamburg'}, {id:'00433', name:'Berlin'} ];  

var s = 0;
var v = 0;

// 5 * 6 = 30

cron.scheduleJob('10-39 10 * * *', function() {
//cron.scheduleJob('27-33 14 * * *', function() {
	console.log('update ' + Object.entries(updater.values)[v][1] + " for " + stats[s].name);
	updater.update(stats[s].id, Object.entries(updater.values)[v][0]);
	
	v++;	
	if (v >= updater.values.length) { v = 0; s++; }
	if (s >= stats.length) { s=0; }
});

app.use(express.static('public'));

router(app);

app.listen(1337, function() {
	console.log('Server listening on port 1337');
});

