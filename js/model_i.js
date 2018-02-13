// (c) Gerhard Döppert, 2017, GNU GPL 3

var pool = null;

const datatab = 'wetter_home.data';

function setPg(p)
{
	pool = p;
}

function toDay(tag)
{
	if (tag && tag !== 'undefined' && tag != 0) {
		var tg = tag.split('.');
		if (tg.length != 3) { tg = tag.split("-"); tag = new Date(tg[0], tg[1]-1, tg[2])}
		else {
			tag=new Date(tg[2], tg[1]-1, tg[0]);
		}
	} else {
		tag = new Date();
	}
	return tag;
}

function years() {  // read list of weather stations and first year with data

	return new Promise(function(resolve, reject) {
		
		pool.query("select 0, distinct year from "+datatab)
		.then(
			(res) => {
				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].year = res.rows[j].year.getFullYear();
				}
				resolve(res.rows); 
			},
			(err) => { console.log(err); reject(err); }
		)
	});	
}


function auswahl(stat, admin) {  // return last 8 items for a station

	return new Promise(function(resolve, reject) {
		var fields = ",temp_o, hum_o, pres, lum_o";
		if (admin) fields += ", temp_i1, temp_i2, hum_i, lum_i";
		
		pool.query('SELECT mtime' +fields +
				" from "+datatab+
				" where stat=$1 " +
				" order by mtime desc limit 8", [stat])
		.then(
			(res) => {
				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].time_d = res.rows[j].mtime.toLocaleDateString("de-DE");
					res.rows[j].time_t = res.rows[j].mtime.toLocaleTimeString("de-DE");
				}
				res.v
				resolve(res.rows); 
			},
			(err) => { console.log(err); reject(err); }
		)
	});	
}

// return data for one year (aggregated per month)
function listMonate(jahr, stat, admin) {

	return new Promise(function(resolve, reject) {

		var home = "";
		var tag1 = toDay("01.01."+jahr);
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
		" group by date_trunc('day', mtime) ) as t group by extract(month from time_d) " +
		' order by month';
		//console.log(query);
		pool.query(query, [tag1, tag2, stat, jahr])
		.then(
			(res) => {
				resolve(res.rows); 
			},
			(err) => { console.log(err); reject(err); }
		)
	});	
}

// return data for one month, aggregated per day
function listMonat(monat, stat, admin) {

	return new Promise(function(resolve, reject) {

		var tag1 = toDay("01." + monat);
		var tag2 = new Date(tag1);
		tag2.setMonth(tag2.getMonth()+1);

		tag2.setMilliseconds(-1); //before midnight

		pool.query("SELECT date_trunc('day', mtime) as time_d, extract(day from date_trunc('day', mtime)) as tag, "+
				 "round(avg(temp_o),1) as temp_o_avg, round(min(temp_o),1) as temp_o_min, round(max(temp_o),1) as temp_o_max  "+
				',round(avg(hum_o)) as hum_o, round(avg(pres)) as pres, round(avg(lum_o),2) as lum_o' +
				(admin ?
				  ', round(avg(temp_i1),1) as temp_i1_avg, round(avg(temp_i2),1) as temp_i2_avg,'+
				   ' round(avg(hum_i)) as hum_i, round(avg(lum_i),2) as lum_i ' : ''
				) +				
				' from '+datatab+' where mtime between $1 and $2 ' + 
				" and stat=$3 " +
				" group by date_trunc('day', mtime) order by time_d", [tag1, tag2, stat])
		.then(
			(res) => {
				while (res.rows.length>0 && res.rows[0] > 1) res.rows.shift();
				while (res.rows.length>0 && res.rows[res.rows.length-1] < 28) res.rows.pop();
				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].time_d = res.rows[j].time_d.toLocaleDateString('de-DE');					
				}
				resolve(res.rows); 
			},
			(err) => { console.log(err.stack); reject(err); }
		);
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
		
		var t1 = toDay(tag1);
		var t2 = toDay(tag2);
		t2.setDate(t2.getDate()+1);

		t2.setMilliseconds(-1); // before midnight
		
		pool.query("SELECT date_trunc('day', mtime) as day, mtime as time_t , temp_o, hum_o,pres," +
				" lum_o " + 
				(admin ? ", temp_i1, temp_i2, hum_i,lum_i " : '') +
				" from "+datatab+" where mtime between $1 and $2 and stat=$3" + 
				" order by time_t", [t1, t2, stat])
		.then(
			(res) => {
				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].day = res.rows[j].day.toLocaleDateString();
					res.rows[j].time_t = res.rows[j].time_t.toLocaleTimeString();
				}
				resolve(res.rows); 
			},
			(err) => { console.log(err.stack); reject(err); }
		);
	});	
}

module.exports = { 
		setPg: setPg,
		listMonate: listMonate,
		listMonat: listMonat,
		listTag: listTag,
		auswahl: auswahl,
		years: years
};