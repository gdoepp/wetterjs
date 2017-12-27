// (c) Gerhard Döppert, 2017, GNU GPL 3

var express = require('express');

var app = express();

var router = require('./router');

var controller = require('./controller');

var cron = require('node-schedule');

var bodyParser = require('body-parser')

var SegfaultHandler = require('segfault-handler');

SegfaultHandler.registerHandler("crash.log"); 

// install a job to update the 'recent' files from all the selected stations at about 10am

// 6 stationen, 6 minutes
cron.scheduleJob('10-15 10 * * *', () => {
  controller.updateRecentAll();
});

app.use(express.static('public'));

app.use( bodyParser.json() ); 
app.use(bodyParser.urlencoded({ extended: false }))

router(app);

app.listen(1337, function() {
	console.log('Server listening on port 1337');
});

