// (c) Gerhard Döppert, 2017

var wetter = require('./model');

var updater = require('./updater');

var certsAllowed = require('./certs.json');

const env = process.env.NODE_ENV || 'dev';

var expired = 0

console.log(env);

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
			console.log("admin");
			return true; 
		}
	}
	return false;
}

function stats(req, res) {
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1; 
	} 
	var result = {};		
	
	result.stats = updater.stats.slice();
	result.stats.unshift({id: '00000', name: 'Home'});
	result.admin=admin;
	result.stat=result.stats[0].id;
		
	res.send(result);
}

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
		var expires = new Date(heute.getTime()+60*1000);
		res.set({"Cache-Control": "public",
		"Expires": expires.toUTCString()});
		
		res.send(result);
		
	}, function failure(err) {
		res.send(err);
	});
}

function listMonate(req, res) {
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1; 
	} 
	var mod = req.headers['if-modified-since'];
	var heute = new Date();
	var expires = new Date(heute.getTime()+60*60*1000); // 1h
	if (mod) {
		var modTime = new Date(mod);
		if (heute.getTime()-modTime.getTime() < 24*60*60*1000) {  // 24h
			res.status(304);
		}
	}
	wetter.listMonate(req.query.jahr, req.query.stat, admin)
	.then(function success(data) {
		res.set({"Cache-Control": "public",
			"Last-Modified": heute.toUTCString(),
			"Expires": expires.toUTCString()});
		res.send(data);
	}, function failure(err) {
		res.send(err);
	});
}

function listMonat(req, res) {
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1; 
	} 
	var mod = req.headers['if-modified-since'];
	var heute = new Date();
	var expires = new Date(heute.getTime()+60*60*1000);  // 1h
	if (mod) {
		var modTime = new Date(mod);
		if (heute.getTime()-modTime.getTime() < 60*60*1000) {  // 1h
			res.status(304);
		}
	}
wetter.listMonat(req.query.monat, req.query.stat, admin)
	.then(function success(data) {
		res.set({"Cache-Control": "public",
			"Last-Modified": heute.toUTCString(),
			"Expires": expires.toUTCString()});
		res.send(data);
	}, function failure(err) {
		res.send(err);
	});
}

function listTag(req, res) {
	var admin = 0;
	if (checkCert(req))	 {
		 admin=1; 
	} 
	var mod = req.headers['if-modified-since'];
	var heute = new Date();
	var minutes = (req.query.stat>0 ? 60 : 1);
	var expires = new Date(heute.getTime()+minutes*60*1000);

	if (mod) {
		var modTime = new Date(mod);
		if (heute.getTime()-modTime.getTime() < minutes*60*1000) { // 1min - 1h
			res.status(304);
		}
	}
	wetter.listTag(req.query.tag, req.query.stat, admin)
	.then(function success(data) {
		res.set({"Cache-Control": "public",
			"Last-Modified": heute.toUTCString(),
			"Expires": expires.toUTCString()});
		res.send(data);
	}, function failure(err) {
		res.send(err);
	});
}

function update(req, res) {
	
	var statid = req.params.stat;

	if (statid=='00000') { res.send('{"update":0}'); return; }
	
	if (!checkCert(req)) {
		 console.log("update not allowed");
		 res.send('{"update":-1}'); return; 
	}
	
	console.log("update: id="+statid);
	
	// download and process files sequentially
	
	try {
		updater.updateAllValues(statid, () => { res.send('{"update":1}');});
	} catch(ex) { console.log(ex); res.send('{"update":-2}'); }	
	//res.send('{"update":1}');
}

module.exports = {
		listMonate: listMonate,
		listMonat: listMonat,
		listTag: listTag,
		update: update,
		auswahl: auswahl,
		stats: stats,
		expired: expired
};

