// (c) Gerhard Döppert, 2017

var wetter = require('./model');

var updater = require('./updater');

var certsAllowed = require('./certs.json');

const env = process.env.NODE_ENV || 'dev';

console.log(env);

function checkCert(req) {
	
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
	wetter.listMonate(req.query.jahr, req.query.stat, admin)
	.then(function success(data) {
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
	wetter.listMonat(req.query.monat, req.query.stat, admin)
	.then(function success(data) {
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
	wetter.listTag(req.query.tag, req.query.stat, admin)
	.then(function success(data) {
		res.send(data);
	}, function failure(err) {
		res.send(err);
	});
}

function update(req, res) {
	
	var statid = req.params.stat;

	if (statid=='00000') { res.send("OK"); return; }
	
	if (!checkCert(req)) {
		 console.log("update not allowed");
		 res.send("OK"); return; 
	}
	
	console.log("update: id="+statid);
	
	// download and process files sequentially
	
	try {
	
		updater.update(statid, "P0")
		.then(function (n) {
			console.log("n: "+n);
			return updater.update(statid, "TU");
		}, function (e) { console.log(e);} )
		.then(function (n) {
			console.log("n: "+n);
			return updater.update(statid, "RR");		
		}, function (e) {  console.log(e); })
		.then(function (n) {
			console.log("n: "+n);
			return updater.update(statid, "N");		
		}, function fail(e) {console.log(e); })
		.then(function (n) {
			console.log("n: "+n);
			return updater.update(statid, "FF");
		}, function (e) {  console.log(e); return updater.update(statid, "FF"); })
		.then(function (n) {
			console.log("n: "+n);
		}, function (e) {  console.log(e); });
	} catch(ex) { res.send("NOK")}
	console.log("ready");
	res.send("OK");
}

module.exports = {
		listMonate: listMonate,
		listMonat: listMonat,
		listTag: listTag,
		update: update,
		auswahl: auswahl,
		stats: stats
};

