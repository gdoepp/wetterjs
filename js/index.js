// (c) Gerhard Döppert, 2017, GNU GPL 3

var express = require('express');

var app = express();

var router = require('./router');

var controller = require('./controller');

var cron = require('node-schedule');

var bodyParser = require('body-parser');

const env = process.env.NODE_ENV || 'dev'

// install a job to update the 'recent' files from all the selected stations at about 10am

cron.scheduleJob('32 12 * * *', () => {
  controller.updateRecentAll();
});

app.use(express.static('dist'));

app.use('/v2/api-docs', (req, res, next) => {
	res.sendFile('openapi.yaml', {root: __dirname+'/../api'});
});

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
  passphrase: queue.pw,
  ca: []
};

for (var j=0; j<queue.cacertfiles.length; j++) {
	var ca= fs.readFileSync(queue.cacertfiles[j]);
	opts.ca.push(ca);
}

amqp.connect(queue.addr, opts, function(err, conn) {
  if (conn) {
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
  } else {
	  console.log(err);
  }
});



