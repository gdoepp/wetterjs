// (c) Gerhard Döppert, 2017, GNU GPL 3

// model for home weather station

var modbase = require('./model_base');

var pool = null;

const datatab = 'wetter_home.data';

function setPg(p)
{
	pool = p;
}

function years() {  // read list of weather stations and first year with data

	return new Promise(function(resolve, reject) {
		
		pool.query("select 0, distinct year from "+datatab)
		.then(
			(res) => {
				res.type = 'Stationen';
				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].year = res.rows[j].year.getFullYear();
					res.rows[j].name = '###';
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
		var fields = ",temp_o1, temp_o2, hum_o, pres, lum_o";
		if (admin) fields += ", temp_i1, temp_i2, temp_i3, temp_i4, temp_i5, hum_i, lum_i";
		
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

		var home = "";
		var tag1 = modbase.toDay("01.01."+jahr);
		var tag2 = new Date(tag1);
		tag2.setFullYear(tag2.getFullYear()+1);
		tag2.setMilliseconds(-1);
		
		var query = "SELECT extract(month from t.time_d) || '.' || $4 as monat, extract(month from t.time_d) as month, "+
		home+ ' round(avg(t.temp_o),1) as temp_o_avg, '+
		'round(avg(temp_o_min),1) as temp_o_min, round(avg(temp_o_max),1) as temp_o_max,'+
		'round(min(temp_o_min),1) as temp_o_absmin, round(max(temp_o_max),1) as temp_o_absmax,'+
		'round(avg(hum_o)) as hum_o, round(avg(pres),1) as pres, round(avg(lum_o),2) as lum_o '+
		(admin ? 
		  ', round(avg(temp_i1), 1) as temp_i1_avg, ' +
		  'round(avg(temp_i2),1) as temp_i2_avg, round(avg(hum_i),1) as hum_i, round(avg(lum_i),2) as lum_i ' : ''
		)+
		" from (select date_trunc('day',mtime) as time_d, avg(temp_i1) as temp_i1, avg(temp_o) as temp_o, " +
		' max(temp_o) as temp_o_max, min(temp_o) as temp_o_min, avg(hum_o) as hum_o, avg(pres) as pres , ' +
		' avg(hum_i) as hum_i, '+
		' avg(temp_i2) as temp_i2, avg(lum_i) as lum_i, avg(lum_o) as lum_o '+
		" from "+datatab+" where mtime between $1 and $2 and stat=$3 " + 
		" group by 1 ) as t group by extract(month from time_d) " +
		' order by month';
		// console.log(query);
		var prom = pool.query(query, [tag1, tag2, stat, jahr]);
        modbase.evalMonate(prom, jahr, stat, resolve, reject);
	});
}

// return data for one month, aggregated per day
function listMonat(monat, stat, admin) {

	return new Promise(function(resolve, reject) {

		var tag1 = modbase.toDay("01." + monat);
		var tag2 = new Date(tag1);
		tag2.setMonth(tag2.getMonth()+1);
		modbase.fixDst(tag1);
		modbase.fixDst(tag2);
		
		tag2.setMilliseconds(-1); // before midnight
		
		var prom = pool.query("SELECT date_trunc('day', mtime) as time_d, extract(day from date_trunc('day', mtime)) as tag, "+
				 "round(avg(temp_o),1) as temp_o_avg, round(min(temp_o),1) as temp_o_min, round(max(temp_o),1) as temp_o_max  "+
				',round(avg(hum_o)) as hum_o, round(avg(pres)) as pres, round(avg(lum_o),2) as lum_o' +
				(admin ?
				  ', round(avg(temp_i1),1) as temp_i1_avg, round(avg(temp_i2),1) as temp_i2_avg,'+
				   ' round(avg(hum_i)) as hum_i, round(avg(lum_i),2) as lum_i ' : ''
				) +				
				' from '+datatab+' where mtime between $1 and $2 ' + 
				" and stat=$3 " +
				" group by 1 order by time_d", [tag1, tag2, stat]);
		
		modbase.evalMonat(prom, monat, stat, resolve, reject);
	});	
}

// return data for one or more days, no aggregation
function listTag(tag, isTage, stat, admin) {
	
	return new Promise(function(resolve, reject) {		
		if (typeof tag === 'undefined' || tag === 'undefined' || tag==0) { 
			var heute = new Date();
			if (stat !=='00000') {
				// heute.setDate(heute.getDate()-1);
			}
			tag = heute.toISOString().split('T')[0];
		}
		
		var t1;
		var t2;
		if (isTage) {
			[t1, t2] = modbase.threeDays(tag);
		} else {
			t1 = modbase.toDay(tag);
			modbase.fixDst(t1);
			t2 = new Date(t1);
		}
		
		t2.setDate(t2.getDate() + 1);
		modbase.fixDst(t2);
		t2.setMilliseconds(-1); // before midnight
				
		var prom = pool.query("SELECT date_trunc('day', mtime) as day, mtime as time_t , temp_o1, temp_o2, hum_o,pres,lum_o " + 
				(admin ? ", temp_i1, temp_i2,temp_i3,temp_i4, temp_i5, hum_i,lum_i " : '') +
				" from "+datatab+" where mtime between $1 and $2 and stat=$3" + 
				" order by time_t", [t1, t2, stat]);
		modbase.evalTag(prom, tag, isTage, stat, resolve, reject);
	});	
}

module.exports = { 
		setPg: setPg,
		listMonate: listMonate,
		listMonat: listMonat,
		listTag: listTag,
		aktuell: aktuell,
		years: years
}