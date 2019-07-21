// (c) Gerhard Döppert, 2017,
// SPDX-License-Identifier: GPL-3.0-or-later

const JSZip = require("jszip");
const {gzip, ungzip} = require('node-gzip');

const fs = require('fs');
const ReadlineStream = require('readline-stream');
const StreamBuffers = require('stream-buffers');

const FTP = require('ftp');

const request = require("request-promise-native");

const datatab = 'wetter_retro.data';
const datatabhome = 'wetter_home.data';
const datatabrecent = 'wetter_retro.data_dwdrecent';
const datatabEsp = 'wetter_retro.aemet_es';
const statstab = 'wetter_retro.stats';

var pool = null;

var api_key_aemet = null;

function pad (s, size) {
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

function setPg(p)
{
	pool = p;
}

function setApiKeyAemet(k) {
	api_key_aemet = k;
}

// insert-or-update functions


function insertHome(data) {
	if (!data.hum_o) {
		data.hum_o=data.hum;
	}
	
	const q = {
			 name: 'insert-home',
			 text: 'insert into '+datatab+' (stat, mtime, temp_i, temp_o, pres, hum_o) values($1, $2, $3, $4, $5, $6) ',
			 values: ['00000', data.time, data.temp_i, Math.min(data.temp_o, data.temp_o2), data.pres, data.hum_o]	 
	};

	const q2 = {
			 name: 'insert-home2',
			 text: 'insert into '+datatabhome+
			 ' (stat, mtime, temp_i1, temp_i2, hum_i,lum_o, lum_i, temp_o, pres, hum_o, daylight, temp_o2, temp_i3, temp_i4, temp_i5, temp_o1) '+
			       'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) ',
			 values: ['00000', data.time, data.temp_i, data.temp_i2, data.hum_i, 
				 	data.lum_o, data.lum_i, Math.min(data.temp_o1, data.temp_o2), data.pres, data.hum_o,data.daylight, 
				 	data.temp_o2, data.temp_i3, data.temp_i4, data.temp_i5, data.temp_o1]	 
	};

	return pool.query(q).then( ()=> { return pool.query(q2);});
}

function insertDwd(data, tab, client) {
	 const q = {
			 name: 'insert-dwd',
			 text: 'insert into '+tab+' (stat, mtime, temp_o, pres, hum_o,cloud, precip, windf, windd, sun)'+
			 ' values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ' +
			 'on conflict(stat, mtime) do update set temp_o=excluded.temp_o, hum_o=excluded.hum_o,pres=excluded.pres,' +
			 ' cloud=excluded.cloud,precip=excluded.precip,windf=excluded.windf,windd=excluded.windd,sun=excluded.sun',
			 values: [data.stat, data.mtime, data.temp_o, data.pres, data.hum_o, 
				 data.cloud, data.precip, data.windf, data.windd, data.sun]	 
	 };
	 
	return client.query(q);
}

function insertFr(data, tab, client) {
	 const q = {
			 name: 'insert-fr',
			 text: 'insert into '+tab+' (stat, mtime, temp_o, pres, hum_o, precip, windf, windd)'+
			 ' values($1, $2, $3, $4, $5, $6, $7, $8) ' +
			 'on conflict(stat, mtime) do update set temp_o=excluded.temp_o, hum_o=excluded.hum_o,pres=excluded.pres,' +
			 ' precip=excluded.precip,windf=excluded.windf,windd=excluded.windd',
			 values: [data.numer_sta, data.mtime, data.t, data.pmer, data.u, 
				data.rr3, data.ff, data.dd]	 
	 };
	 
	return client.query(q);
}


function check(s) {
	if (typeof s == 'undefined') {
		return null;		
	}
	if (s === 'Ip' || s === 'NaN') {
		return null;
	}
	try {
		return Number.parseFloat(s.replace(',', '.'));
	} catch(e) {
		return null;
	}
}

function insertEsp(data, tab, client) {
	 const q = {
			 name: 'insert-esp',
			 text: 'insert into '+tab+' (stat, mtime, tmed, tmin, tmax, pres, precip, windf, windf_max, windd, sun)'+
			 ' values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ',
			 values: [data.indicativo, data.fecha, 
			 check(data.tmed), check(data.tmin), check(data.tmax), 
			 (check(data.presMin)+check(data.presMax))/2,  
			 check(data.prec), check(data.velmedia), 
			 check(data.racha), data.dir*10, 
			 check(data.sol)*60]	 
	 };
	 
	return client.query(q);
}

async function storeDB(table, dbtab, insertFn) {
	
	var n=-1;
	
	// use transaction, otherwise pg may autocommit and fsync after every line depending on WAL
	
	const client = await pool.connect();
	try {		
		await client.query('BEGIN'); 

		n=0;
		for (var line in table) {
			
			var data = table[line];
			var res = await insertFn(data, dbtab, client);
			n = n + res.rowCount;
		}

		await client.query('COMMIT');
	} catch (e) {
		console.log('rolling back'); 
		await client.query('ROLLBACK');
		throw e;
	} finally {
		client.release();
	}
	return n;
}

function delete_all(stat) { // delete all data for station
	 const q = {
			 name: 'delete-all',
			 text: 'delete from '+datatab+' where stat=$1',				
			 values: [stat]
	 };
	return  pool.query(q);
}

function getLatest(stat, tab) { 
	 const q = {
			 name: 'get-latest-'+tab,
			 text: 'select max(mtime) as mx from '+tab+' where stat=$1',				
			 values: [stat]
	 };
	return  pool.query(q)
	       .then( (m) => {
	    	   if (m.rows.length > 0) {
	    		   var t = m.rows[0].mx;
	    		   if (typeof t === 'undefined' || t === null || t === '') {
	    			   t = '1961-01-01T00:00:00Z';
	    		   }
	    		   return new Date(t);
	    	   }
	    	   else return new Date('1961-01-01T00:00:00Z');
	       }, (e) => {
	    	   return new Date('1961-01-01T00:00:00Z');
	       });
}

function cleanup(stat) { // delete data without temperature
	 const q = {
			 name: 'clean-up',
			 text: 'delete from '+datatab+' where stat=$1 and mtime < (SELECT min(mtime) from '+datatab+' where temp_o is not null and stat=$1)',				
			 values: [stat]
	 };
	 
	 return pool.query(q)
	 .then( (p) => {
		 console.log("deleted rows (no temp yet): " + p.rowCount);
	 }, (err) => {
		 console.log(err);		
	 });
}

function refresh(stat) { // refresh view with the stations/years
	 const q1 = {
		     name: 'refresh',
			 text: 'refresh materialized view '+statstab,				
			 values: []
		 };		 
	 
	 return pool.query(q1)
	 .then( (p) => {
		 console.log('refreshed station list');	
	 }, (err) => {
		 console.log(err);		
	 });
}


var fields = {'RR': ['precip'], 'TU' : ['temp_o','hum_o'], 'P0': ['pres'], 'N': [0,'cloud'], 'FF': ['windf','windd'], 'SD': ['sun']};
var paths = {'RR': 'precipitation', 'TU' : 'air_temperature', 'P0': 'pressure', 
			 'N': 'cloudiness', 'FF': 'wind', 'SD': 'sun'};

var stats= [
	{id:'00000', name: '####', vals: [ 'temp', 'hum', 'pres', 'lum'], freq:1, at:99, model:'i'},
	{id:'04928', name:'Stuttgart', vals: [ 'temp', 'hum', 'pres', 'precip', 'cloud', 'sun', 'wind' ], freq:1, at:0, model:'o'},
	{id:'01420', name:'Frankfurt', vals: [ 'temp', 'hum', 'pres', 'precip', 'cloud', 'sun', 'wind' ], freq:10, at:2, model:'o'}, 
	{id:'05705', name:'Würzburg', vals: [ 'temp', 'hum', 'pres', 'precip', 'cloud', 'sun', 'wind' ], freq:1, at:0, model:'o'},
	{id:'02600', name:'Kitzingen', vals: [ 'temp', 'hum', 'precip' ], freq:10, at:3, model:'o'},
	{id:'03668', name:'Nürnberg', vals: [ 'temp', 'hum', 'pres', 'precip', 'cloud', 'sun', 'wind' ], freq:10, at:3, model:'o'},
	{id:'03379', name:'München', vals: [ 'temp', 'hum', 'pres', 'precip', 'cloud', 'sun', 'wind' ], freq:10, at:2, model:'o'},
	{id:'02667', name:'Köln-Bonn', vals: [ 'temp', 'hum', 'pres', 'precip', 'cloud', 'sun', 'wind' ], freq:31, at:1, model:'o'},
	{id:'01048', name:'Dresden', vals: [ 'temp', 'hum', 'pres', 'precip', 'cloud', 'sun', 'wind' ], freq:31, at:1, model:'o'},
	{id:'01975', name:'Hamburg', vals: [ 'temp', 'hum', 'pres', 'precip', 'cloud', 'sun', 'wind' ], freq:10, at:4, model:'o'}, 
	{id:'00433', name:'Berlin', vals: [ 'temp', 'hum', 'pres', 'precip', 'sun', 'wind' ], freq:10, at:4, model:'o'},
	{id:'3129',  name:'Madrid', vals: [ 'temp', 'pres', 'precip', 'sun', 'wind' ], freq:10, at:5, model:'es'},
	{id:'0076',  name:'Barcelona', vals: [ 'temp', 'pres', 'precip', 'sun', 'wind' ], freq:10, at:4, model:'es'},	
	{id:'5783',  name:'Sevilla', vals: [ 'temp', 'pres', 'precip', 'sun', 'wind' ], freq:10, at:6, model:'es'},
	{id:'07149', name:'Orly', vals: [ 'temp', 'hum', 'pres', 'precip', 'wind' ], freq:31, at:2, model:'fr'}
];  

function getStats() {
	var allstats = stats.slice();
	return allstats;
}


function insert(statid, value, resolve0, reject0, data, table) {
	
	console.log("insert: " + statid + ", ", value);
	
	JSZip.loadAsync(data)
	.then( (zip) => {
		var found=false;
		zip.forEach( (path, file) => {
			if (path.startsWith('produkt_')) {
				console.log(path);
				found=true;
				var lstream = new ReadlineStream({re:/(.*\r\n)|(.+$)/g});
				lstream.on('data', (c) => { 
					if (c) {
						var [stat, zeit, qn, v1, v2, rest] = c.split(';');
						stat=stat.trim();
						if (stat !=='STATIONS_ID' && v1 != -999) {
							if (v2 == -999) v2 = null;
							var mtime = zeit.substr(0,4)+"-"+ zeit.substr(4,2)+"-"+zeit.substr(6,2) +
							 		'T'+zeit.substr(8,2) + ":00:00.00Z";
							var key = stat+'#'+mtime;
							var v = table[key];
							if (!v) { v = {"stat":stat, "mtime":mtime}; table[key] = v; }
							var ff = fields[value];
							if (ff[0] && v1) {v[ff[0]] = v1.trim(); }
							if (ff.length>1 && ff[1] && v2) { v[ff[1]] = v2.trim(); }
						}
					} 
				});
				lstream.on('end', () =>  {					
					resolve0(table);					
				});
				lstream.on('error', (e) =>  {	
					console.log('error on zip-stream ' + e);
				});
				file.nodeStream().pipe(lstream);
			}
		
		});
		if (!found) { reject0("no data ('produkt_*') found in dwd zip file")}
	},
	(err) => { console.log("error processing dwd zip file: " + err); reject0(err); });
}

function update(statid, what, value, table) {
	
	if (statid == 0) return;  // home data, not dwd

	console.log("called update: " + what + " " + value);
	
	statid = pad(statid,5);
	
	return new Promise(function(resolve, reject) {
	
		var path='/climate_environment/CDC/observations_germany/climate/hourly/'+paths[value]+'/'+what+'/';
		 var c = new FTP();
		  c.on('ready', function() {
			var myWritableStreamBuffer = new StreamBuffers.WritableStreamBuffer({
		    	    initialSize: (100 * 1024),   
		    	    incrementAmount: (100 * 1024) 
			});
			  
			c.list(path, (err, list) => {
				console.log('listing path ' + path);
				var found = false;
				for (var f in list) {
					if (list[f].name.indexOf('stundenwerte_'+value+'_'+statid) >= 0) {
  			    	    
						found = true;

						console.log("found file in path: " +list[f].name);
						c.get(path+list[f].name, function(err, stream) {
						      if (err) { reject(err); }
						      if (stream) {
						    	  var len=0;
						    	  stream.on('error', (e) => {
						    		  console.log('ftp get error! '+ e);
						    		  c.end();
						    		  reject(e);
						    	  });
						    	  stream.on('data', (d) => { // workaround for node 10+ ???
							    	    len += d.length;
							    	    if (len === list[f].size) {
							    	    	console.log("end reached");
							    	    	stream.end();
							    	    }
							    	  });
							      stream.on('end', function() { 
							    	  c.end();
							    	  try {
							    		  insert(statid, value, resolve, reject, myWritableStreamBuffer.getContents(), table);
							    	  } catch(ex) { reject(ex); }
							    	  console.log("downloaded: " + statid + ", ", value);
							      });
							      			      
							      stream.pipe(myWritableStreamBuffer);
						      }
						});
						break
					}
				}
				if (!found) { 
					reject('ftp: remote file for '+value+' not found');
				}
			});
		  });
		  
		  c.connect({host:'opendata.dwd.de'});
	});
}


async function updateAllValues(statid, what) {
	
	var table = {};
	
		// download and process all files for the station, continue on error

	try {
		await update(statid, what, "TU", table); 		
	} catch(e) { console.log(e); }

	try {
		await update(statid, what, "P0", table); 		
	} catch(e) { console.log(e); }

	try {
		await update(statid, what, "RR", table); 		
	} catch(e) { console.log(e); }

	try {
		await update(statid, what, "N", table); 		
	} catch(e) { console.log(e); }

	try {
		await update(statid, what, "FF", table); 		
	} catch(e) { console.log(e); }

	try {
		await update(statid, what, "SD", table); 		
	} catch(e) { console.log(e); }

	try {
		return await storeDB(table, what == 'recent' ? datatabrecent : datatab, insertDwd);
	} catch(e) { console.log('nothing inserted'); throw(e); }

}

async function updateEsp(statid) {
	
	console.log("import spain");
	
	var now = new Date();
	var fourY = 1000*60*60*24*4*365+1;
	var fechaIni = await getLatest(statid, datatabEsp);
	
	console.log('since: ' +fechaIni);
	
	while (fechaIni < now) {
		var fechaFin = new Date(fechaIni.valueOf() + (fourY-1000));
		
		var fechaIniStr = fechaIni.toISOString().replace('.000Z', 'UTC').replace(/:/g, '%3A');
		var fechaFinStr = fechaFin.toISOString().replace('.000Z', 'UTC').replace(/:/g, '%3A');
		
		console.log("inserting from " + fechaIniStr + " to " + fechaFinStr);
		
		var prom = new Promise(function(resolve, reject) {
		
			var options = { method: 'GET',
					  url: 'https://opendata.aemet.es/opendata/api/valores/climatologicos/diarios/datos/fechaini/'+fechaIniStr+'/fechafin/'+fechaFinStr+
					  '/estacion/'+statid,
					  //qs: {'fechaini': fechaIniStr, 'fechafin': fechaFinStr,   'estacion': statid},
					  headers: 
					    { 'cache-control': 'no-cache',
						  'Accept':  'application/json',
						  'api_key': api_key_aemet
					    } 
					  };
			
			request(options)
			.then( (body) => {
			   var result = JSON.parse(body)
			   if (result.estado == 200) {
				  console.log("fetching " + result.datos);
			  
				  var options2 = { 
						  method: 'GET',
						  url : result.datos
				  		};
				  return request(options2);
			   }				  
			 }, (err) => {
				console.log("error in first get: " + err);
				reject(err);
				return null;
			 })
			.then( (body) => {
			   if (body != null) {
				   var result = JSON.parse(body);
				   storeDB(result, datatabEsp, insertEsp);
				   resolve();
			   }
		     }, (err) => {
			   console.log("error in second get: " + err);
			   reject(err);
			 });				
		});
		
		try {
 		  await prom;
		} catch (e) {
		  console.log("error in esp-update: " + e);
		}
	    fechaIni = new Date(fechaFin.valueOf()+1000);
	}	
}

async function updateFr(statid) {
	
	console.log("import france");
	
	var now = new Date();
	
	var fechaIni = await getLatest(statid, datatab);
	if (fechaIni < new Date('1996-01-01')) {
		fechaIni = new Date('1996-01-01');
	}
	fechaIni = new Date(fechaIni.getTime()+24*60*60*1000);
	
	
	while (fechaIni < now) {

		var mon = fechaIni.getFullYear() + String(fechaIni.getMonth()+1).padStart(2, '0');
		console.log('month: ' + mon);
		
		var prom = new Promise(function(resolve, reject) {
		
			var options = { method: 'GET',
					  url: 'https://donneespubliques.meteofrance.fr/donnees_libres/Txt/Synop/Archive/synop.'+mon+'.csv.gz',
					  transform: function (body, response, resolveWithFullResponse) {
						console.log('len: ' +response.headers['content-length'] + " type: " + typeof body );
						if (response.headers['content-type'] === 'application/x-gzip')  {
							return ungzip(body);
						}
					  },
					  headers: 
					    { 'cache-control': 'no-cache'
					    }, 
					  encoding: null
					  };
			
			request(options)
			.then( (body) => {
				var lines = body.toString('ascii').split('\n');
				var colNames = lines[0].split(';');
				var table = [];
				for (var j=1; j<lines.length; j++) {
					var colsOfLine = lines[j].split(';');
					var f = {};
					for (ifn in colNames) {
						f[colNames[ifn]] = colsOfLine[ifn];
					}
					if (f.numer_sta == '07149') {
						f.mtime = f.date.substr(0,4) + '-' + f.date.substr(4,2) + '-' + f.date.substr(6,2) + 'T' + 
						    f.date.substr(8,2) + ':' + f.date.substr(10,2) + ':' + f.date.substr(12,2) + 'Z';
						if (f.pmer == 'mq') f.pmer = null; else f.pmer = f.pmer / 100.0;
						if (f.t == 'mq') f.t = null; else f.t = f.t - 273.15;
						if (f.rr3 == 'mq' || f.rr3 < 0) f.rr3 = 0;
						if (f.u == 'mq') f.u = null;
						if (f.ff == 'mq') f.ff = null;
						if (f.dd == 'mq') f.dd = null;
						table.push(f); 
						}
				}
				storeDB(table, datatab, insertFr);
				resolve();
			 }, (err) => {
				console.log("error in get: " + err);
				reject(err);
				return null;
			 });
			 
		});
		try {
 		  await prom;
		} catch (e) {
		  console.log("error in fr-update: " + e);
		}
		fechaIni.setMonth( fechaIni.getMonth() + 1, 1);
		console.log("next month: " + fechaIni.toLocaleDateString());
	}	
}

module.exports = {
		setPg: setPg,
		update: update,
		values: paths,
		getStats: getStats,
		stats: 	stats,
		insertHome: insertHome,
		updateAllValues: updateAllValues,
		updateEsp: updateEsp,
		updateFr: updateFr,
		delete_all: delete_all,
		clean_up: cleanup,
		refresh: refresh,
		setApiKeyAemet: setApiKeyAemet

};
