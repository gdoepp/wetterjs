// (c) Gerhard Döppert, 2017, GNU GPL 3

var JSZip = require("jszip");
var fs = require('fs');
var ReadlineStream = require('readline-stream');
var StreamBuffers = require('stream-buffers');
var FTP = require('ftp');

const datatab = 'wetter_retro.data';
const datatabhome = 'wetter_home.data';
const datatabrecent = 'wetter_retro.data_dwdrecent';
const statstab = 'wetter_retro.stats';

var pool = null;

function setPg(p)
{
	pool = p;
}


// insert-or-update functions


function insertHome(data) {
	if (!data.hum_o) {
		data.hum_o=data.hum;
	}
	
	const q = {
			 name: 'insert-home',
			 text: 'insert into '+datatab+' (stat, mtime, temp_i, temp_o, pres, hum_o) values($1, $2, $3, $4, $5, $6) ',
			 values: ['00000', data.time, data.temp_i, data.temp_o, data.pres, data.hum_o]	 
	};

	const q2 = {
			 name: 'insert-home2',
			 text: 'insert into '+datatabhome+' (stat, mtime, temp_i1, temp_i2, hum_i,lum_o, lum_i, temp_o, pres, hum_o, daylight) '+
			       'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ',
			 values: ['00000', data.time, data.temp_i, data.temp_i2, data.hum_i, 
				 	data.lum_o, data.lum_i, data.temp_o, data.pres, data.hum_o,data.daylight]	 
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

async function storeDB(table, mode) {
	
	var n=-1;
	
	// use transaction, otherwise pg may autocommit and fsync after every line depending on WAL
	
	const client = await pool.connect();
	try {		
		await client.query('BEGIN'); 

		n=0;
		for (var line in table) {
			
			var data = table[line];
		
			var res = await insertDwd(data, mode == 'recent' ? datatabrecent : datatab, client);
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

function cleanup(stat) { // delete data without temperature, refresh view with the stations/years
	 const q = {
			 name: 'clean-up',
			 text: 'delete from '+datatab+' where stat=$1 and mtime < (SELECT min(mtime) from '+datatab+' where temp_o is not null and stat=$1)',				
			 values: [stat]
	 };
	 const q1 = {
		     name: 'refresh',
			 text: 'refresh materialized view '+statstab,				
			 values: []
		 };		 
	 
	 return pool.query(q)
	 .then( (p) => {
		 console.log("deleted rows (no temp yet): " + p.rowCount);
		 return  pool.query(q1);
	 }, (err) => {
		 console.log(err);		
		 return  pool.query(q1);
	 });
}


var fields = {'RR': ['precip'], 'TU' : ['temp_o','hum_o'], 'P0': ['pres'], 'N': [0,'cloud'], 'FF': ['windf','windd'], 'SD': ['sun']};
var paths = {'RR': 'precipitation', 'TU' : 'air_temperature', 'P0': 'pressure', 
			 'N': 'cloudiness', 'FF': 'wind', 'SD': 'sun'};

var stats= [
	{id:'04928', name:'Stuttgart'},
	{id:'01420', name:'Frankfurt'}, 
	{id:'05705', name: 'Würzburg'},
	{id:'03379', name:'München'},
	// {id:'03668', name:'Nürnberg'},
	{id:'01975', name:'Hamburg'}, 
	{id:'00433', name:'Berlin'}
];  


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
				file.nodeStream().pipe(lstream);
				lstream.on('readable', () => { 
					var c = lstream.read(); 
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
			}
		
		});
		if (!found) { reject0("no data ('produkt_*') found in dwd zip file")}
	},
	(err) => { console.log("error processing dwd zip file: " + err); reject0(err); });
}

function update(statid, what, value, table) {
	
	if (statid == 0) return;  // home data, not dwd

	console.log("called update: " + what + " " + value);
	
	return new Promise(function(resolve, reject) {
	
		var path='/pub/CDC/observations_germany/climate/hourly/'+paths[value]+'/'+what+'/';
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
							      stream.once('close', function() { 
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
		  
		  c.connect({host:'ftp-cdc.dwd.de'});
	});
}


async function updateAllValues(statid, what) {
	
	var table = {};
	
		// download and process all files for the station, continue on error

	try {
		await update(statid, what, "TU", table); 		
	} catch(e) { console.log(e); }

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
		return await storeDB(table, what);
	} catch(e) { console.log('nothing inserted'); throw(e); }

}

module.exports = {
		setPg: setPg,
		update: update,
		values: paths,
		stats: stats,
		insertHome: insertHome,
		updateAllValues: updateAllValues,
		delete_all: delete_all,
		clean_up: cleanup
};
