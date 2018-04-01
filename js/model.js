// (c) Gerhard Döppert, 2017, GNU GPL 3

// model for DWD hourly data

var modbase = require('./model_base');

var pool = null;

const datatab = 'wetter_retro.data';
const statstab = 'wetter_retro.stats';

function setPg(p)
{
	pool = p;
}


function years() {  // read list of weather stations and first year with data

	return new Promise(function(resolve, reject) {
		
		pool.query("select stat, year as jahr from "+statstab)
		.then(
			(res) => {
				res.type = 'Stationen';
				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].jahr = res.rows[j].jahr.getFullYear();
					// res.rows[j].name 
					res.rows[j].type = 'Station';
				}
				resolve(res.rows); 
			},
			(err) => { console.log(err); reject(err); }
		)
	});	
}


function aktuell(stat, admin) {  // return last 8 items for a station

	return new Promise(function(resolve, reject) {
		var fields = ",temp_o, hum_o, pres, precip, cloud, windf, ARRAY[windf,windd] as windd";
		
		var prom = pool.query('SELECT mtime' +fields +
				" from "+datatab+
				" where stat=$1 " +
				" order by mtime desc limit 8", [stat]);
		modbase.evalAktuell(prom, stat, resolve, reject);
	});	
}

// return data for one year (aggregated per month)
function listMonate(jahr, stat, admin) {

	return new Promise(function(resolve, reject) {

		var tag1 = modbase.toDay("01.01."+jahr);
		var tag2 = new Date(tag1);
		tag2.setFullYear(tag2.getFullYear()+1);
		tag2.setMilliseconds(-1);
		
		var query = "SELECT extract(month from t.time_d) || '.' || $4 as monat, extract(month from t.time_d) as month, "+
		' round(avg(t.temp_o),1) as temp_o_avg, '+
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
		" from "+datatab+" where mtime between $1 and $2 and stat=$3 " + 
		" group by date_trunc('day', mtime) ) as t group by extract(month from time_d) " +
		' order by month';
		//console.log(query);
		var prom = pool.query(query, [tag1, tag2, stat, jahr]);
	    modbase.evalMonate(prom, jahr, stat, resolve, reject);
	});
}
function listMonat(monat, stat, admin) {

	return new Promise(function(resolve, reject) {

		var tag1 = modbase.toDay("01." + monat);
		var tag2 = new Date(tag1);
		tag2.setMonth(tag2.getMonth()+1);
		modbase.fixDst(tag1);
		modbase.fixDst(tag2);

		tag2.setMilliseconds(-1); //before midnight
				
		var tab = 'wetter_retro.data';

		var prom = pool.query("SELECT date_trunc('day', mtime) as time_d, extract(day from date_trunc('day', mtime)) as tag, "+
				 "round(avg(temp_o),1) as temp_o_avg, "+
				'round(min(temp_o),1) as temp_o_min, round(max(temp_o),1) as temp_o_max, round(sum(sun)/60,1) as sun, '+
				'round(avg(hum_o)) as hum_o, round(avg(pres),1) as pres, round(sum(precip),1) as precip, round(avg(cloud),1) as cloud, '+
				' round(avg(windf),1) as windf, max(windf) as windf_max, arc_avg2(ARRAY[windf, windd]) as windd ' +
				' from '+datatab+' where mtime between $1 and $2 ' + 
				" and stat=$3 " +
				" group by date_trunc('day', mtime) order by time_d", [tag1, tag2, stat]);
		modbase.evalMonat(prom, monat, stat, resolve, reject);
	});	
}

// return data for one or more days, no aggregation
function listTag(tag1, tag2, stat, admin) {
	
	return new Promise(function(resolve, reject) {		
		if (typeof tag1 === 'undefined' || tag1 === 'undefined' || tag1==0) { 
			var heute = new Date();
			if (stat !=='00000') {
				//heute.setDate(heute.getDate()-1);
			}
			tag1 = heute.toISOString().split('T')[0];
			tag2 = tag1;
		}
		
		var t1 = modbase.toDay(tag1);
		var t2 = modbase.toDay(tag2);
		t2.setDate(t2.getDate()+1);
		
		modbase.fixDst(t1);
		modbase.fixDst(t2);
		
		t2.setMilliseconds(-1); // before midnight
		
		var prom = pool.query("SELECT date_trunc('day', mtime) as day, mtime as time_t, temp_o, "+				
				'hum_o, pres, precip, cloud, sun, windf, ARRAY[windf,windd] as windd '+
				" from "+datatab+" where mtime between $1 and $2 and stat=$3" + 
				" order by time_t", [t1, t2, stat]);
		modbase.evalTag(prom, tag1, tag2, stat, resolve, reject);
	});	
}

module.exports = { 
		setPg: setPg,
		listMonate: listMonate,
		listMonat: listMonat,
		listTag: listTag,
		aktuell: aktuell,
		years: years
};