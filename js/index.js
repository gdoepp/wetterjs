// (c) Gerhard Döppert, 2017, GNU GPL 3

var express = require('express');

var app = express();

var router = require('./router');

var updater = require('./updater');

var cron = require('node-schedule');

var s = 0;
var v = 0;

// 5 * 6 = 30

cron.scheduleJob('10-39 10 * * *', () => {
	
	console.log('update ' + Object.entries(updater.values)[v][1] + " for " + updater.stats[s].name);
	var t1 = Date.now();
	updater.update(updater.stats[s].id, Object.entries(updater.values)[v][0])
	.then( (n) => {
			console.log("rows: "+n);
			console.log('time taken: ' + (Date.now()-t1) + "ms");
		          },  
		 (err) => { console.log(err);} 
	);
	
	v++;	
	if (v >= Object.entries(updater.values).length) { v = 0; s++; }
	if (s >= updater.stats.length) { s=0; }
});

app.use(express.static('public'));

router(app);

app.listen(1337, function() {
	console.log('Server listening on port 1337');
});

