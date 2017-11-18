// (c) Gerhard Döppert, 2017, GNU GPL 3

var JSZip = require("jszip");
var fs = require('fs');
var ReadlineStream = require('readline-stream');
var StreamBuffers = require('stream-buffers');
var pg = require('pg');
var FTP = require('ftp');
var env = process.env.NODE_ENV || 'dev';

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


// insert-or-update functions, return promise

function insertPres(data) {
	 const q = {
			 name: 'insert-pres',
			 text: 'insert into wetter_home.dwd_data (stat, mtime, pres) values($1, $2, $3) ' +
				'on conflict(stat, mtime) do update set pres=excluded.pres',
			 values: data.slice(0,3)	 
	 };
	return pool.query(q);
}

function insertTempRf(data) {
	 const q = {
			 name: 'insert-tu',
			 text: 'insert into wetter_home.dwd_data (stat, mtime, temp_o, hum_o) values($1, $2, $3, $4) '+
				'on conflict(stat, mtime) do update set temp_o=excluded.temp_o, hum_o=excluded.hum_o',
			values: data.slice(0,4)			
	 };
	 return  pool.query(q);
}

function insertSonne(data) {
	const q = {
			name: 'insert-sonne',
			text: 'insert into wetter_home.dwd_data (stat, mtime, sun) values($1, $2, $3) '+
			'on conflict(stat, mtime) do update set sun=excluded.sun',
			values: data.slice(0,3)
	};
	 return  pool.query(q);
}

function insertRs(data) {
	 const q = {
			 name: 'insert-precip',
			 text: 'insert into wetter_home.dwd_data (stat, mtime, precip) values($1, $2, $3) '+
				'on conflict(stat, mtime) do update set precip=excluded.precip',
			 values: data.slice(0,3)
	 };
	 return  pool.query(q);
}
function insertNm(data) {
	data.splice(2,1);
	const q = {
			name: 'insert-cloud',
			text: 'insert into wetter_home.dwd_data (stat, mtime, cloud) values($1, $2, $3) '+
				'on conflict(stat, mtime) do update set cloud=excluded.cloud',				
			values: data.slice(0,3)
	};
	return  pool.query(q);
}

function insertWind(data) {
	 const q = {
			 name: 'insert-wind',
			 text: 'insert into wetter_home.dwd_data (stat, mtime, windf, windd) values($1, $2, $3, $4) '+
					'on conflict(stat, mtime) do update set windf=excluded.windf,windd=excluded.windd',				
			 values: data.slice(0,4)
	 };
	return  pool.query(q);
}

var funcs = {'RR': insertRs, 'TU' : insertTempRf, 'P0': insertPres, 'N': insertNm, 'FF': insertWind, 'SD': insertSonne};
var paths = {'RR': 'precipitation', 'TU' : 'air_temperature', 'P0': 'pressure', 
			 'N': 'cloudiness', 'FF': 'wind', 'SD': 'sun'};

var stats= [{id:'04928', name:'Stuttgart'},{id:'01420', name:'Frankfurt'},
	{id:'03379', name:'München'}, {id:'01975', name:'Hamburg'}, {id:'00433', name:'Berlin'} ];  


function update(statid, value) {

	if (statid == '00000') return;  // home data, not dwd
	
	return new Promise(function(resolve, reject) {
	
		var path='/pub/CDC/observations_germany/climate/hourly/'+paths[value]+'/recent/';
		 var c = new FTP();
		  c.on('ready', function() {
			var myWritableStreamBuffer = new StreamBuffers.WritableStreamBuffer({
		    	    initialSize: (100 * 1024),   
		    	    incrementAmount: (10 * 1024) 
			});
			  
		    c.get(path+"stundenwerte_"+value+"_"+statid+"_akt.zip", function(err, stream) {
		      if (err) { reject(err); }
		      if (stream) {
			      stream.once('close', function() { 
			    	  c.end();
			    	  try {
			    		  insert(statid, value, resolve, reject, myWritableStreamBuffer.getContents());
			    	  } catch(ex) { reject(ex); }
			    	  console.log("downloaded: " + statid + ", ", value);
			    	  });
			      			      
			      stream.pipe(myWritableStreamBuffer);
		      }
		    });
		  });
		  
		  c.connect({host:'ftp-cdc.dwd.de'});
	});
}

function insert(statid, value, resolve0, reject0, data) {
	
	console.log("insert: " + statid + ", ", value);

	JSZip.loadAsync(data)
	.then( (zip) => {
		zip.forEach(  (path,file) => {
			if (path.startsWith('produkt_')) {
				console.log(path);
				var prom = [];
				var lstream = new ReadlineStream({re:/(.*\r\n)|(.+$)/g});
				file.nodeStream().pipe(lstream);
				lstream.on('readable', () => { 
					var c = lstream.read(); 
					if (c) {
						var [stat, zeit, qn, v1, v2, rest] = c.split(';');
						if (stat !=='STATIONS_ID' && v1 != -999) {
							var mtime = zeit.substr(0,4)+"-"+ zeit.substr(4,2)+"-"+zeit.substr(6,2) +
							 		'T'+zeit.substr(8,2) + ":00:00.00Z";		
							prom.push(funcs[value]([stat, mtime, v1, v2]));
						}
					} 
				});
				lstream.on('end', () =>  {
					
					Promise.all(prom)
					.then( (p) => {
						var n = 0;
						for (var j=0; j<p.length; j++) n += p[j].rowCount;
						resolve0(n); console.log(value + " ready");
					} )
					.catch( (err) => { reject0(err);});
					
				});
			}				
		});	
	});
}

function updateAllValues(statid, sendMsg) {
	
	var t1 = Date.now();
	
	update(statid, "P0")
	.then(function (n) {
		console.log("rows: "+n);
		return update(statid, "TU");
	}, function (e) { console.log(e);  return update(statid, "TU"); } )
	.then(function (n) {
		console.log("rows: "+n);
		return update(statid, "RR");		
	}, function (e) {  console.log(e); return update(statid, "RR");})
	.then(function (n) {
		console.log("rows: "+n);
		return update(statid, "N");		
	}, function fail(e) {console.log(e); return update(statid, "N"); })
	.then(function (n) {
		console.log("rows: "+n);
		return update(statid, "FF");
	}, function (e) {  console.log(e); return update(statid, "FF"); })
	.then(function (n) {
		console.log("rows: "+n);
		return update(statid, "SD");
	}, function (e) { console.log(e); return update(statid, "SD"); })
	.then(function (n) {
		console.log("rows: "+n);
		console.log('time taken: ' + (Date.now()-t1) + "ms");
		console.log("ready");
		sendMsg();
	}, function (e) { console.log(e); }	);
}

module.exports = { 
		update: update,
		values: paths,
		stats: stats,
		updateAllValues: updateAllValues
};