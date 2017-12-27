// (c) Gerhard Döppert, 2017

var wetter = require('./model')

var updater = require('./updater')

const certsAllowed = require('./certs.json')

const pg = require('pg').native;

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

updater.setPg(pool);  // forward to updater
wetter.setPg(pool);   // forward to model

var expired = new Date(); // force expire of all possibly cached results

function checkCert(req) {  // checking certificates is done by Apache, result is forwarded via headers 
	
	if (env === 'dev') return true;
	
	if (req.headers['ssl_client_verify'] !== 'SUCCESS' || 
		!req.headers['ssl_client_s_dn'] || !req.headers['ssl_client_i_dn']) {
		return false;
	}
	
	for (var j=0; j < certsAllowed.length; j++) {
		var cert = certsAllowed[j];
		if (req.headers['ssl_client_s_dn'].indexOf(cert.subjectString) >= 0 &&
		    req.headers['ssl_client_i_dn'].indexOf(cert.issuerString) >= 0) {
			return true; 
		}
	}
	return false;
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

// list stations and their first year with data
function stats(req, res) {
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1; 
	}
	
	if (checkUnmodified(req, res, 24*60)) return; // 1 day
		
	var result = {};		
	
	result.stats = updater.stats.slice();
	result.stats.unshift({id: '00000', name: '####'}); // our met station at home
	result.admin=admin;
	result.stat=result.stats[0].id;
	result.station=result.stats[0].name;
	wetter.years() 
	.then( (data) => {
		result.rows = data;
		res.send(result);
	}, (err) => {
		res.status(500);
		res.send(err);
	} );
}

// return a list of some recent data
function auswahl(req, res) {
	
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1; 
	} 
	
	wetter.auswahl(req.query.stat, admin)
	.then(function success(data) {

		var result = {};		
	
		result.rows = data;
		var heute = new Date();
		var expires = new Date(heute.getTime()+60*1000);  // 1 min
		res.set({"Cache-Control": "public",
		"Expires": expires.toUTCString()});
		
		res.send(result);
		
	}, function failure(err) {
		res.status(500).send(err);
	});
}

// data aggregated by month for one year
function listMonate(req, res) {
	
	var minutes=60;
	
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1; 
		 minutes=1;
	} 
	
	if (checkUnmodified(req, res, 24*60)) return; // 1d ago, unless explicitly expired

	var heute = new Date();
	var expires = new Date(heute.getTime()+minutes*60*1000); // 1h
	
	wetter.listMonate(req.query.jahr, req.query.stat, admin)
	.then(function success(data) {
		res.set({"Cache-Control": "public",
			"Last-Modified": heute.toUTCString(),
			"Expires": expires.toUTCString()});
		res.send(data);
		
	}, function failure(err) {
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
	
	if (checkUnmodified(req, res, 60)) return; // 1 h ago
	
	var heute = new Date();
	var expires = new Date(heute.getTime()+minutes*60*1000); // 1h

	wetter.listMonat(req.query.monat, req.query.stat, admin)
	.then(function success(data) {
		res.set({"Cache-Control": "public",
			"Last-Modified": heute.toUTCString(),
			"Expires": expires.toUTCString()});
		res.send(data);
	}, function failure(err) {
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

	wetter.listTag(req.query.tag1, req.query.tag2, req.query.stat, admin)
	.then(function success(data) {
		res.set({"Cache-Control": "public",
			"Last-Modified": heute.toUTCString(),
			"Expires": expires.toUTCString()});
		
		res.send(data);
	}, function failure(err) {
		res.status(500).send(err);
	});
}

// update recent data from DWD, fast, should not hit timeout 
function update(req, res) {
	
	var statid = req.params.stat;

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
		}),
		(err) => {
			console.log(err); res.json({"update":-2}); 			
		};
	} catch(ex) { console.log(ex); res.json({"update":-2}); }	
	//res.send({"update":1});
}

// import historical data from DWD, slow, we send the response immediately
function importHist(req, res) {
	
	var statid = req.params.stat;
	
	if (statid=='00000') { res.send('{"update":0}'); return; } // not dwd
	
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
			console.log("deleted rows: "+p.rowCount);
			return updater.updateAllValues(statid, 'historical'); })
		.then( (p) => {
			console.log("updated rows: "+p);
			expired = new Date();  
			return updater.clean_up(statid); })
		.then( (p) => {
			console.log("cleaned up");
			console.log('time taken: ' + (Date.now()-t1) + "ms"); }, 
			(err) => {
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
		update: update,
		importHist: importHist,
		insertHome: insertHome,
		auswahl: auswahl,
		stats: stats,
		expired: expired,
		updateRecentAll: updateRecentAll
};
