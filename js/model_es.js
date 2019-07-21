// (c) Gerhard Döppert, 2017
// SPDX-License-Identifier: GPL-3.0-or-later
// model for DWD hourly data

var modbase = require('./model_base');

var pool = null;

const datatab = 'wetter_retro.aemet_es';
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
		var fields = ",tmed, pres, precip, windf, ARRAY[windf,windd] as windd";
		
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
		
		var query = "SELECT extract(month from mtime) || '.' || $4 as monat, extract(month from mtime) as month, "+
		' round(avg(tmed),1) as temp_o_avg, '+
		'round(avg(tmin),1) as temp_o_min, round(avg(tmax),1) as temp_o_max,'+
		'round(min(tmin),1) as temp_o_absmin, round(max(tmax),1) as temp_o_absmax,'+
		'round(avg(pres),1) as pres, round(sum(precip),1) as precip,'+
		'round(avg(sun/60), 1) as sun, ' +
		'round(avg(windf),1) as windf, max(windf_max) as windf_max, arc_avg2(ARRAY[windf,windd]) as windd ' +
		
		" from "+datatab+" where mtime between $1 and $2 and stat=$3 " + 
		" group by extract(month from mtime) " +
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
				
		var prom = pool.query("SELECT date_trunc('day', mtime) as time_d, extract(day from date_trunc('day', mtime)) as tag, "+
				 "tmed as temp_o_avg, "+
				'tmin as temp_o_min, tmax as temp_o_max, round(sun/60,1) as sun, '+
				'pres, precip, '+
				' windf, windf_max, ARRAY[windf,windd] as windd ' +
				' from '+datatab+' where mtime between $1 and $2 ' + 
				" and stat=$3 " +
				" order by time_d", [tag1, tag2, stat]);
		modbase.evalMonat(prom, monat, stat, resolve, reject, true);		
	});	
}

// return data for one or more days, no aggregation
function listTag(tag, isTage, stat, admin) {
	
	return new Promise(function(resolve, reject) {	
		
		if (typeof tag === 'undefined' || tag === 'undefined' || tag==0) { 
			var heute = new Date();
			if (stat !=='00000') {
				//heute.setDate(heute.getDate()-1);
			}
			tag = heute.toISOString().split('T')[0];
		}
		reject('not available');
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