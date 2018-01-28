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

var amqp = require('amqplib/callback_api');

const queue = require('./queue-dev.json')
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
    var q = 'wetterhome';

    ch.assertQueue(q, {durable: false});
    console.log("Waiting for messages in %s.", q);
    ch.consume(q, controller.insertHomeMq, {noAck: true});
  });
});




