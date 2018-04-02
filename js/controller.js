// (c) Gerhard Döppert, 2017

var wetter_o = require('./model')
var wetter_i = require('./model_i')

var updater = require('./updater')

const certsAllowed = require('./certs.json')

const pg = require('pg');

const env = process.env.NODE_ENV || 'dev'

// manage db connection
const pool = new pg.Pool(
		(env === 'dev') ?
		{
		 
		     user: 'gd',
				  host: 'localhost',
				  database: 'pgdb',
				  password: '',
				  port: 5432
		}
		:
		{
	
		    user: 'www',
		    host: 'localhost',
		    database: 'wetter',
		    password: process.env.PGPW,
		    port: 5432
	  
		});

updater.setPg(pool);    // forward to updater
wetter_o.setPg(pool);   // forward to model
wetter_i.setPg(pool);   // forward to model

var expired = new Date(); // force expire of all possibly cached results

function checkCert(req) {  // checking certificates is done by Apache, result is forwarded via headers 
	
	if (env === 'dev') return true;
	
	if (req.headers['ssl_client_verify'] !== 'SUCCESS' || 
		!req.headers['ssl_client_s_dn'] || !req.headers['ssl_client_i_dn']) {
		return false;  // guest
	}
	
	for (var j=0; j < certsAllowed.length; j++) {
		var cert = certsAllowed[j];
		if (req.headers['ssl_client_s_dn'].indexOf(cert.subjectString) >= 0 &&
		    req.headers['ssl_client_i_dn'].indexOf(cert.issuerString) >= 0) {
			return true; // allowed, privileged
		}
	}
	return false; // guest
}

// is the result the client received before still valid?
function checkUnmodified(req, res, maxTimeMin) {
	var mod = req.headers['if-modified-since'];
	if (mod) {
		
		var jetzt = new Date();
		var modTime = new Date(mod);
		if (jetzt.getTime()-modTime.getTime() < maxTimeMin*60*1000 &&  // min -> ms
				expired.getTime() < modTime.getTime() ) {
			res.status(304).end();
			return true;
		}
	}
	return false;
}

function checkCrossOriginAllowed(res, meth='GET') {
	if (env === 'dev') {  // allow cross origin access from frontend
		res.set({'Access-Control-Allow-Methods': meth+',OPTIONS',
		'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'});
	}
}

function addCacheControl(res, modified, expires) {
	res.set({"Cache-Control": "public",
		"Last-Modified": modified.toUTCString(),
		"Expires": expires.toUTCString()});
}

// list stations and their first year with data, also sends link templates for further requests
function stats(req, res) {
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1; 
	}
	
	if (checkUnmodified(req, res, 24*60)) return; // 1 day
		
	var result = {};		
	
	result.stats = updater.getStats();
	result.admin=admin;
	result.links = [{rel: 'templateJahr', href: '/listJahr?stat={{stat}}&jahr={{time}}', method: 'get'},
					{rel: 'templateMonat', href: '/listMonat?stat={{stat}}&monat={{time}}', method: 'get'},
					{rel: 'templateTag', href: '/listTag?stat={{stat}}&tag={{time}}', method: 'get'},
					{rel: 'templateAktuell', href: '/aktuell?stat={{stat}}', method: 'get'},
					{rel: 'insertHome', href: '/insert', method: 'post'},
					{rel: 'templateUpdate', href: '/update/{{stat}}', method: 'post'},
					{rel: 'templateHistory', href: '/import/{{stat}}', method: 'post'},
	];
	
	wetter_o.years() 
	.then( (data) => {
		result.rows = data;
		checkCrossOriginAllowed(res);
		res.send(result);
	}, (err) => {
		res.status(500);
		res.send(err);
	} );
}

// returns a list of some recent data
function aktuell(req, res) {
	
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1; 
	} 
	
	if (!req.query.stat) {
		res.status(400).send("parameter <stat> missing"); 
		return;
	}

	var wetter = (req.query.stat == 0 ? wetter_i : wetter_o);
	
	wetter.aktuell(req.query.stat, admin)
	.then(function success(data) {

		var heute = new Date();
		var expires = new Date(heute.getTime()+60*1000);  // 1 min
		addCacheControl(res, heute, expires)
		checkCrossOriginAllowed(res);
		res.send(data);
		
	}, function failure(err) {
		res.status(500).send(err);
	});
}

function formatDe(f, d) {  // for download, locale: de
	if (f !=='monat' && f != 'time_d' && f != 'day' && typeof(d) === 'string') d = d.replace('.', ','); 
	else if (typeof(d) === 'number') d = d.toLocaleString('de-DE');
	else if (!d) d = ''; 
	return d + '\t';
}

function toCsv(data) {  // for download
	var list="";
	if (data.length>0) {
	   var d = data[0];
	   for (var f in d) {
		   if (f === 'link') { continue; }
		   if (f === 'windd') { list = list + 'wind2f\t'; }
		   list = list +f;
		   list = list + '\t';
	   }
	   list = list + '\n';			
	}
	var numform = /^[0-9]+[.][0-9]+$/
	for (var j=0; j<data.length; j++) {
		   var d = data[j];
		   for (var f in d) {
			   if (f === 'link') { continue; }
			   if (f === 'windd' && d[f]) { 
				   var d2 = d[f]; list = list + formatDe('wind2f', d2[0]) + formatDe('windd', d2[1]); 
			   } else list = list + formatDe(f,d[f]);
		   }
		   list = list + '\n';
	   }
	return list;
}

// data aggregated by month for one year
function listMonate(req, res) {
	
	var minutes=60; // valid for one hour
	
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1; 
		 minutes=1;
	} 
	
	if (!req.query.jahr) {
		res.status(400).send("parameter <jahr> missing")
		return;
	}
	if (!req.query.stat) {
		res.status(400).send("parameter <stat> missing")
		return;
	}

	if (checkUnmodified(req, res, 24*60)) return; // 1d ago, unless explicitly expired

	var heute = new Date();
	var expires = new Date(heute.getTime()+minutes*60*1000); // 1h
	
	var wetter = (req.query.stat == 0 ? wetter_i : wetter_o);
	
	wetter.listMonate(req.query.jahr, req.query.stat, admin)
	.then(function success(data) {

		addCacheControl(res, heute, expires)
		checkCrossOriginAllowed(res);
		if (req.path.indexOf('download')>=0) {
			res.set({'Content-Type': 'text/csv; charset=utf-8',
	        'Content-Disposition': 'attachment;filename=jahr.csv'});
			data = toCsv(data.rows);
		}
		res.send(data);
		
	}, function failure(err) {
		console.log(err);
		res.status(500).send(err);
	});
}

// data for one month, by day
function listMonat(req, res) {
	
	var minutes=60;
	
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1; 
		 minutes=1;
	} 
	if (!req.query.monat) {
		res.status(400).send("parameter <monat> missing")
		return;
	}
	if (!req.query.stat) {
		res.status(400).send("parameter <stat> missing")
		return;
	}

	if (checkUnmodified(req, res, 60)) return; // 1 h ago
	
	var heute = new Date();
	var expires = new Date(heute.getTime()+minutes*60*1000); // 1h

	var wetter = (req.query.stat == 0 ? wetter_i : wetter_o);
	
	wetter.listMonat(req.query.monat, req.query.stat, admin)
	.then(function success(data) {
		addCacheControl(res, heute, expires)
		checkCrossOriginAllowed(res);
		if (req.path.indexOf('download')>=0) {
			res.set({'Content-Type': 'text/csv; charset=utf-8',
	        'Content-Disposition': 'attachment;filename=monat.csv'});
			data = toCsv(data.rows);
		}

		res.send(data);
	}, function failure(err) {
		console.log(err);
		res.status(500).send(err);
	});
}

// data for one day (or a few days), by hour
function listTag(req, res) {
	
	var minutes = (req.query.stat>0 ? 60 : 1);
	
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1;
		 minutes=1;
	}	
	
	if (checkUnmodified(req, res, minutes)) return; // 1 h (for dwd) or 1 min (for home)
	
	var heute = new Date();
	var expires = new Date(heute.getTime()+minutes*60*1000); 
	
	if (!req.query.tag1) {
		req.query.tag1 = req.query.tag;
		req.query.tag2 = req.query.tag;
	}
	if (!req.query.tag1) {
		res.status(400).send("parameter <tag> missing")
		return;
	}
	if (!req.query.stat) {
		res.status(400).send("parameter <stat> missing")
		return;
	}

	var wetter = (req.query.stat == 0 ? wetter_i : wetter_o);
	
	wetter.listTag(req.query.tag1, req.query.tag2, req.query.stat, admin)
	.then(function success(data) {
		addCacheControl(res, heute, expires)
		checkCrossOriginAllowed(res);
		if (req.path.indexOf('download')>=0) {
			res.set({'Content-Type': 'text/csv; charset=utf-8',
	        'Content-Disposition': 'attachment;filename=tag.csv'});
			data = toCsv(data.rows);
		}

		res.send(data);
	}, function failure(err) {
		res.status(500).send(err);
	});
}

function options(req, res) {
	
	res.set({"Cache-Control": "public",
		'Access-Control-Max-Age': 86400,
		'Vary': 'Accept-Encoding, Origin',
		'Connection': 'Keep-Alive'});
	checkCrossOriginAllowed(res);
	res.end();
}


// update recent data from DWD, fast, should not hit timeout 
function update(req, res) {
	
	if (!req.params.stat) {
		res.status(400).send("parameter <stat> missing")
		return;
	}

	var statid = req.params.stat;
	
	checkCrossOriginAllowed(res);
	
	if (statid==0) { res.json({"update":0}); return; } // not dwd
	
	if (!checkCert(req)) {
		 console.log("update recent not allowed");
		 res.json({"update":-1}); return; 
	}
	
	console.log("update: id="+statid);
	var t1 = Date.now();
	
	// download and process files sequentially
	try {
		updater.updateAllValues(statid, 'recent')
		.then( (p) => {
			res.json({"update":1}); 
			expired = new Date(); 
			console.log("updated rows: "+p);
			console.log('time taken: ' + (Date.now()-t1) + "ms");
		},
		(err) => {
			console.log(err); res.json({"update":-2}); 			
		});
	} catch(ex) { console.log(ex); res.json({"update":-2}); }	
	//res.send({"update":1});
}

// import historical data from DWD, slow, we send the response immediately
function importHist(req, res) {
	
	if (!req.params.stat) {
		res.status(400).send("parameter <stat> missing")
		return;
	}

	var statid = req.params.stat;
	
	checkCrossOriginAllowed(res);
	
	if (statid=='00000' || statid==0) { res.send('{"update":0}'); return; } // not dwd
	
	if (!checkCert(req)) {
		 console.log("import not allowed");
		 res.json({"update":-1}); return; 
	}
	
	console.log("import: id="+statid);

	var t1 = Date.now();
	
	// download and process files sequentially	
	try {
		updater.delete_all(statid)  // prevent conflicts, import should only happen once, anyway.
		.then( (p) => {
			console.log("deleted existing rows: "+p.rowCount);
			return updater.updateAllValues(statid, 'historical'); })
		.then( (p) => {
			console.log("updated rows: "+p + " ?");
			expired = new Date();  
			return updater.clean_up(statid); })
		.then( (p) => {
			console.log("cleaned up");
			console.log('time taken: ' + (Date.now()-t1) + "ms"); }, 
			(err) => {
				console.log('time taken: ' + (Date.now()-t1) + "ms"); 
				console.log(err); });
		
	} catch(ex) { console.log(ex); }
	
	res.json({"update":2});  // send "in work", no further response when done
}

// accept current weather data of a home station 
// format is:  { "time": now_timestamp, "temp_i": temp_indoors, "temp_o": temp_outdoors, "pres": pressure_at_sealevel, "hum": humidity_outdoors  }
//            encoded as json (Content-Type: application/json), or urlencoded

function insertHome(req, res) {
	
	if (!checkCert(req)) {
		 console.log("update home not allowed");
		 res.status(403);
		 res.json({"update":-1}); return; 
	}
	//console.log("insert: " + req.body );

	updater.insertHome(req.body)
	.then( (p) => { res.send('ok'); },
  		 (err) => {  res.status(500).send('nok'); }
  		 );
}

function insertHomeMq(msg) {
	msg = JSON.parse(msg.content);
	updater.insertHome(msg);
}

var s = 0; // static 

function updateRecentAll() {  // update one station for every call of this function
	console.log('update ' + updater.stats[s].name);
	var t1 = Date.now();
	updater.updateAllValues(updater.stats[s].id, 'recent')
	.then( (p) => {
		console.log("updated rows: "+p);
		console.log('time taken: ' + (Date.now()-t1) + "ms");
		expired = new Date();  
	},
	(err) => {
		console.log(err);
	});
	s++;
	if (s >= updater.stats.length) { s=0; }  // return to first station
}

module.exports = {
		listMonate: listMonate,
		listMonat: listMonat,
		listTag: listTag,
		options: options,
		update: update,
		importHist: importHist,
		insertHome: insertHome,
		insertHomeMq: insertHomeMq,
		aktuell: aktuell,
		stats: stats,
		expired: expired,
		updateRecentAll: updateRecentAll
};
