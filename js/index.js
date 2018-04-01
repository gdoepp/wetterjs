// (c) Gerhard Döppert, 2017, GNU GPL 3

var express = require('express');

var app = express();

var router = require('./router');

var controller = require('./controller');

var cron = require('node-schedule');

var bodyParser = require('body-parser')

var SegfaultHandler = require('segfault-handler');

const env = process.env.NODE_ENV || 'dev'

SegfaultHandler.registerHandler("crash.log"); 

// install a job to update the 'recent' files from all the selected stations at about 10am

// 6 stationen, 6 minutes
cron.scheduleJob('10-15 12 * * *', () => {
  controller.updateRecentAll();
});

app.use(express.static('dist'));

app.all('/*;*', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('dist/index.html', {root: __dirname+'/..'});
});

app.use( bodyParser.json() ); 
app.use(bodyParser.urlencoded({ extended: false }))

router(app);

app.listen(1337, function() {
	console.log('Server listening on port 1337'); // apache2 acts as proxy
});

var amqp = require('amqplib/callback_api');  // for collecting locale weather data 

const queue = require('./queue-'+env+'.json')
const fs = require('fs')
var opts = {
	
  cert: fs.readFileSync(queue.certfile),
  key: fs.readFileSync(queue.keyfile),
  passphrase: queue.pw,//fs.readFileSync(queue.pw),
  ca: []
};

for (var j=0; j<queue.cacertfiles.length; j++) {
	var ca= fs.readFileSync(queue.cacertfiles[j]);
	opts.ca.push(ca);
}

amqp.connect(queue.addr, opts, function(err, conn) {
  conn.createChannel(function(err, ch) {
	var ex = 'wetterex';
    ch.assertExchange(ex, 'fanout', {durable: true});
    ch.assertQueue('', {exclusive: true}, (err, q) => {
    	
    	ch.bindQueue(q.queue, ex, '');
    	console.log("waiting for messages on queue "+q.queue);

        ch.consume(q.queue, (msg) => { 
        	controller.insertHomeMq(msg);
        	ch.ack(msg);
        }, {noAck: false});
        
    });
  });
});



