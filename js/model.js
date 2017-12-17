// (c) Gerhard Döppert, 2017, GNU GPL 3

var pg = require('pg');

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


function auswahl(stat, admin) {

	return new Promise(function(resolve, reject) {
		var tab = 'dwd_data';
		if (stat==='00000') {
			tab='data';
		}
		var home = "";
		if (admin) {
			home = ',temp_i';
		}
		
		console.log("auswahl: " + stat)
		
		pool.query('SELECT mtime'+home+', temp_o, '+				
				'hum_o, pres, precip, cloud, windf, windd '+
				" from wetter_home."+tab+
				" where stat=$1 " +
				" order by mtime desc limit 8", [stat])
		.then(
			(res) => {
				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].time_d = res.rows[j].mtime.toLocaleDateString();
					res.rows[j].time_t = res.rows[j].mtime.toLocaleTimeString();
				}
				resolve(res.rows); 
			}
		)
		.catch(
				(err) => { console.log(err.stack); reject(err); }
				);
	});	
}

function listMonate(jahr, stat, admin) {

	return new Promise(function(resolve, reject) {

		var tab = 'dwd_data';
		if (stat==='00000') {
			tab='data';
		}
		var home = "";
		if (admin) {
			home = "round(avg(temp_i),1) as temp_i, ";
		}
		
		var query = "SELECT extract(month from t.time_d) || '.' || $1 as monat, extract(month from t.time_d) as month, "+
		home+ ' round(avg(t.temp_o),1) as temp_o, '+
		'round(avg(temp_o_min),1) as temp_o_min, round(avg(temp_o_max),1) as temp_o_max,'+
		'round(min(temp_o_min),1) as temp_o_absmin, round(max(temp_o_max),1) as temp_o_absmax,'+
		'round(avg(hum_o)) as hum_o, round(avg(pres),1) as pres, round(sum(precip),1) as precip,'+
		'round(avg(cloud),1) as cloud, round(avg(sun), 1) as sun, ' +
		'round(avg(windf),1) as windf, max(windf_max) as windf_max, arc_avg2(wind) as windd ' +
		" from (select date_trunc('day',mtime) as time_d, avg(temp_i) as temp_i, avg(temp_o) as temp_o, " +
		' max(temp_o) as temp_o_max, min(temp_o) as temp_o_min, avg(hum_o) as hum_o, avg(pres) as pres , sum(precip) as precip, ' +
		' avg(cloud) as cloud, sum(sun)/60 as sun, '+
		' avg(windf) as windf, max(windf) as windf_max, '+
		' arc_avg2(ARRAY[windf, windd]) as wind '+
		" from wetter_home."+tab+" where extract(year from mtime) = $1 and stat=$2 " + 
		" group by date_trunc('day', mtime) ) as t group by extract(month from time_d) " +
		' order by month';
		//console.log(query);
		pool.query(query, [jahr, stat])
		.then(
			(res) => {
				resolve(res.rows); 
			}
		)
		.catch(
				(err) => { console.log(err.stack); reject(err); }
			);
	});	
}

function listMonat(monat, stat, admin) {

	return new Promise(function(resolve, reject) {

		var m = monat.split(".");
		
		var mon=m[0];
		var year = m[1];
		
		var tab = 'dwd_data';
		if (stat==='00000') {
			tab='data';
		}
		var home = "";
		if (admin) {
			home = "round(avg(temp_i),1) as temp_i, ";
		}

		pool.query("SELECT date_trunc('day', mtime) as time_d, extract(day from date_trunc('day', mtime)) as tag, "+
				 home+"round(avg(temp_o),1) as temp_o, "+
				'round(min(temp_o),1) as temp_o_min, round(max(temp_o),1) as temp_o_max, round(sum(sun)/60,1) as sun, '+
				'round(avg(hum_o)) as hum_o, round(avg(pres),1) as pres, round(sum(precip),1) as precip, round(avg(cloud),1) as cloud, '+
				' round(avg(windf),1) as windf, max(windf) as windf_max, arc_avg2(ARRAY[windf, windd]) as windd ' +
				' from wetter_home.'+tab+' where extract(month from mtime)=$1 and extract(year from mtime)=$2 ' + 
				" and stat=$3 " +
				" group by date_trunc('day', mtime) order by time_d", [mon, year, stat])
		.then(
			(res) => {
				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].time_d = res.rows[j].time_d.toLocaleDateString();
				}
				resolve(res.rows); 
			}
		)
		.catch(
				(err) => { console.log(err.stack); reject(err); }
			);
	});	
}

function listTag(tag1, tag2, stat, admin) {
	
	return new Promise(function(resolve, reject) {		
		var t1 = tag1;
		var t2 = tag2;
		if (typeof t1 === 'undefined' || t1 === 'undefined' || t1==0) { 
			var heute = new Date();
			t1 = heute.toISOString().split('T')[0];
			t2 = t1;
		}		
		var tab = 'dwd_data';
		if (stat==='00000') {
			tab='data';
		}
		var home = "";
		if (admin) {
			home = ',temp_i';
		}
		
		pool.query("SELECT date_trunc('day', mtime) as day, mtime as time_t "+home+', temp_o, '+				
				'hum_o, pres, precip, cloud, sun, windf, ARRAY[windf,windd] as windd '+
				" from wetter_home."+tab+" where date_trunc('day', mtime) between $1 and $2 and stat=$3" + 
				" order by time_t", [t1, t2, stat])
		.then(
			(res) => {
				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].time_t = res.rows[j].time_t.toLocaleTimeString();
				}
				resolve(res.rows); 
			}
		)
		.catch(
				(err) => { console.log(err.stack); reject(err); }
				);
	});	
}

module.exports = { 
		listMonate: listMonate,
		listMonat: listMonat,
		listTag: listTag,
		auswahl: auswahl
};