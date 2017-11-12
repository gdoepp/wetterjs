var JSZip = require("jszip");
var fs = require('fs');
var ReadlineStream = require('readline-stream');
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
	return pool.query('insert into wetter_home.dwd_data (stat, mtime, pres) values($1, $2, $3) ' +
			'on conflict(stat, mtime) do update set pres=excluded.pres',
			data.slice(0,3));
}

 function insertTempRf(data) {
	 return pool.query('insert into wetter_home.dwd_data (stat, mtime, temp_o, hum_o) values($1, $2, $3, $4) '+
				'on conflict(stat, mtime) do update set temp_o=excluded.temp_o, hum_o=excluded.hum_o',
			data.slice(0,4));
}

function insertSonne(data) {
	 return pool.query('insert into wetter_home.dwd_data (stat, mtime, sun) values($1, $2, $3) '+
				'on conflict(stat, mtime) do update set sun=excluded.sun',
			data.slice(0,3));
}

 function insertRs(data) {
	 return pool.query('insert into wetter_home.dwd_data (stat, mtime, precip) values($1, $2, $3) '+
				'on conflict(stat, mtime) do update set precip=excluded.precip',
			data.slice(0,3));
}
 function insertNm(data) {
	data.splice(3,1);
	return pool.query('insert into wetter_home.dwd_data (stat, mtime, cloud) values($1, $2, $3) '+
				'on conflict(stat, mtime) do update set cloud=excluded.cloud',				
			data.slice(0,3));
}

 function insertWind(data) {
		return pool.query('insert into wetter_home.dwd_data (stat, mtime, windf, windd) values($1, $2, $3, $4) '+
					'on conflict(stat, mtime) do update set windf=excluded.windf,windd=excluded.windd',				
				data.slice(0,4));
	}

var funcs = {'RR': insertRs, 'TU' : insertTempRf, 'P0': insertPres, 'N': insertNm, 'FF': insertWind, 'SD': insertSonne};
var paths = {'RR': 'precipitation', 'TU' : 'air_temperature', 'P0': 'pressure', 
			 'N': 'cloudiness', 'FF': 'wind', 'SD': 'sun'};

function update(statid, value) {

	if (statid == '00000') return;  // home data, no dwd
	
	return new Promise(function(resolve, reject) {
	
		var path='/pub/CDC/observations_germany/climate/hourly/'+paths[value]+'/recent/';
		 var c = new FTP();
		  c.on('ready', function() {
		    c.get(path+"stundenwerte_"+value+"_"+statid+"_akt.zip", function(err, stream) {
		      if (err) { reject(err); }
		      if (stream) {
			      stream.once('close', function() { 
			    	  c.end();
			    	  try {
			    		  insert(statid, value, resolve, reject);
			    	  } catch(ex) { reject(ex); }
			    	  console.log("downloaded: " + statid + ", ", value);
			    	  });
			      stream.pipe(fs.createWriteStream("/tmp/stundenwerte_"+value+"_"+statid+"_akt.zip"));
		      }
		    });
		  });
		  
		  c.connect({host:'ftp-cdc.dwd.de'});
	});
}

function insert(statid, value, resolve0, reject0) {
	
	console.log("insert: " + statid + ", ", value);
	
	new JSZip.external.Promise(function (resolve, reject) {
	    fs.readFile("/tmp/stundenwerte_"+value+"_"+statid+"_akt.zip", function(err, data) {
	        if (err) {
	            reject(e);
	        } else {
	            resolve(data);
	        }
	    });
	}).then(function (data) {
	    return JSZip.loadAsync(data);
	})
	.then(function (zip) {
		zip.forEach(function(path,file) {
			if (path.startsWith('produkt_')) {
				console.log(path);
				var n=0;
				var lstream = new ReadlineStream({re:/(.*\r\n)|(.+$)/g});
				file.nodeStream().pipe(lstream);
				lstream.on('readable', function() { 
					var c = lstream.read(); 
					if (c) {
						var [stat, zeit, qn, v1, v2, rest] = c.split(';');
						if (stat !=='STATIONS_ID' && v1 != -999) {
							var mtime = zeit.substr(0,4)+"-"+ zeit.substr(4,2)+"-"+zeit.substr(6,2) +
							 zeit.substr(8,2) + ":00:00.00Z";							
							var p = funcs[value]([stat, mtime, v1, v2]);
							p.then(function () { n++; } );  // await
							//n++;
						}
					}
				});
				lstream.on('end', function() {
					resolve0(n);  // ready to continue with next file...
				});
			}
				
		});	
	
	});
}

module.exports = { 
		update: update,
		values: paths
		
};