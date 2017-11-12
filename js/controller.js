// (c) Gerhard Döppert, 2017

var wetter = require('./model');

var updater = require('./updater');

const env = process.env.NODE_ENV || 'dev';

console.log(env);

function checkCert(req) {
	if (env !== 'dev' && (req.headers['ssl_client_verify'] !== 'SUCCESS' || 
		!req.headers['ssl_client_s_dn'] || !req.headers['ssl_client_i_dn'] || 
		req.headers['ssl_client_s_dn'].indexOf('CN=gdoeppert.de') == -1 ||
		req.headers['ssl_client_i_dn'].indexOf('CN=gdoeppert.de') == -1)) {
	  console.log("not admin");
	  return false; 
	} else {
	  return true;
	}
}

function auswahl(req, res) {
	console.log("contr: ausw " + req.query.stat);
	wetter.auswahl(req.query.stat)
	.then(function success(data) {

		var result = {};
		
		if (checkCert(req))	 {
			 result.admin=1; 
		} 
	
		result.rows = data;
		res.send(result);
	}, function failure(err) {
		res.send(err);
	});
}

function listMonate(req, res) {
	
	wetter.listMonate(req.query.jahr, req.query.stat)
	.then(function success(data) {
		res.send(data);
	}, function failure(err) {
		res.send(err);
	});
}

function listMonateWind(req, res) {
	
	wetter.listMonateWind(req.query.jahr, req.query.stat)
	.then(function success(data) {
		res.send(data);
	}, function failure(err) {
		res.send(err);
	});
}

function listMonat(req, res) {
	
	wetter.listMonat(req.query.monat, req.query.stat)
	.then(function success(data) {
		res.send(data);
	}, function failure(err) {
		res.send(err);
	});
}

function listTag(req, res) {
	
	wetter.listTag(req.query.tag, req.query.stat)
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
		listMonateWind: listMonateWind,
		listMonat: listMonat,
		listTag: listTag,
		update: update,
		auswahl: auswahl
};

