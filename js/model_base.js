// (c) Gerhard Döppert, 2017, GNU GPL 3

// utilities functions for model

const base_url = '';

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

function fixDst(tag1) {
	if (tag1.getFullYear() < 1970 && tag1.getTimezoneOffset() < -60) {
		tag1.setUTCHours(23); // workaround incorrect DST: midnight in MET
	}
}


function evalAktuell(prom, stat, resolve, reject) { 
		prom.then(
			(res0) => {
				var res = { rows: res0.rows };
				res.type = 'aktuell';
				res.stat = stat;
			for (var j=0; j<res.rows.length; j++) {
				res.rows[j].time_d = res.rows[j].mtime.toLocaleDateString("de-DE");
				res.rows[j].time_t = res.rows[j].mtime.toLocaleTimeString("de-DE");
			}
			resolve(res); 
		},
		(err) => { console.log(err); reject(err); }
	);	
}

// return data for one year (aggregated per month)
function evalMonate(prom, jahr, stat, resolve, reject) {
		
		prom.then(
			(res0) => {
				var res = {};
				res.rows = res0.rows;
				res.type = 'Jahr';
				res.time = jahr;
				res.stat = stat;
				res.links = [
					{ rel: "self", href: base_url + '/listJahr?stat='+stat+'&jahr='+jahr, method: 'get'}
				];

				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].link = { ref: 'child', href: base_url + '/listMonat?stat='+stat+'&monat='+res.rows[j].monat, method: 'get'};
					res.rows[j].type = 'Monat';
				}
				resolve(res); 
			},
			(err) => { console.log(err); reject(err); }
		)
}

// return data for one month, aggregated per day
function evalMonat(prom, monat, stat, resolve, reject) {
	
	var tag1 = toDay("01." + monat);
	var tag2 = new Date(tag1);	
	tag2.setMonth(tag2.getMonth()+1);
	var nxtmon = (tag2.getMonth()+1) + '.' + tag2.getFullYear();
	fixDst(tag1);
	fixDst(tag2);
	var tag3 = new Date(tag1);
	tag3.setMonth(tag3.getMonth()-1);
	var prvmon = (tag3.getMonth()+1) + '.' + tag3.getFullYear();

	prom.then(
			(res0) => {
				var res = {};
				res.rows = res0.rows;
				res.type = 'Monat';
				res.time = monat;
				res.stat = stat;
				res.links = [
					{ rel: "up", href: base_url + '/listJahr?stat='+stat+'&jahr='+tag1.getFullYear(), method: 'get'},
					{ rel: "self", href: base_url + '/listMonat?stat='+stat+'&monat='+monat, method: 'get'},
					{ rel: "nxt", href: base_url + '/listMonat?stat='+stat+'&monat='+nxtmon, method: 'get'},
					{ rel: "prv", href: base_url + '/listMonat?stat='+stat+'&monat='+prvmon, method: 'get'},
				];
				while (res.rows.length>0 && res.rows[0] > 1) res.rows.shift();
				while (res.rows.length>0 && res.rows[res.rows.length-1] < 28) res.rows.pop();
				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].time_d = res.rows[j].time_d.toLocaleDateString('de-DE');	
					res.rows[j].link = {ref: 'child', href: base_url + '/listTag?stat='+stat+'&tag='+res.rows[j].time_d, method: 'get'};
					res.rows[j].type = 'Tag';
				}
				resolve(res); 
			},
			(err) => { console.log(err.stack); reject(err); }
		);	
}

// return data for one or more days, no aggregation
function evalTag(prom, tag1, tag2, stat, resolve, reject) {
		
		var isTage = (tag1 !== tag2);
		var t1 = toDay(tag1);
		var t2 = toDay(tag2);
		var t0 = new Date((t1.getTime()+t2.getTime())/2);
		var mtag = t0.toLocaleDateString();
		t1.setDate(t0.getDate() - (isTage ? 2 : 1) );
		var prvtag = t1.toLocaleDateString();
		t2.setDate(t0.getDate() + (isTage ? 2 : 1));
		var nxttag = t2.toLocaleDateString();
			
		prom.then(
			(res0) => {
				var res = {};
				res.rows = res0.rows;
				res.type = isTage ? 'Tage' : 'Tag';
				res.time = mtag;
				res.stat = stat;
				var links = [];
				
				links.push({ rel: "self", href: base_url + '/listTag?stat='+stat+'&tag1='+tag1+'&tag2='+tag2, method: 'get'});
				
				links.push({rel: "up", 
							href: base_url + '/listMonat?stat='+stat+'&monat='+(t0.getMonth()+1) + '.' + t0.getFullYear(), 
							method: 'get'});
				
				if (isTage) {
					links.push({rel: 't1', href: base_url + '/listTag?stat='+stat+'&tag='+mtag, method: 'get'});
					links.push({rel: 'nxt', href: base_url + '/listTag?stat='+stat+'&tag1='+mtag+'&tag2='+nxttag, method: 'get'});
					links.push({rel: 'prv', href: base_url + '/listTag?stat='+stat+'&tag1='+prvtag+'&tag2='+mtag, method: 'get'});
				} else {
					links.push({rel: 't3', href: base_url + '/listTag?stat='+stat+'&tag1='+prvtag+'&tag2='+nxttag, method: 'get'});
					links.push({rel: 'nxt', href: base_url + '/listTag?stat='+stat+'&tag='+nxttag, method: 'get'});
					links.push({rel: 'prv', href: base_url + '/listTag?stat='+stat+'&tag='+prvtag, method: 'get'});
				}
				
				res.links = links;
				
				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].day = res.rows[j].day.toLocaleDateString();
					res.rows[j].time_t = res.rows[j].time_t.toLocaleTimeString();
					res.rows[j].type = 'Wetterbeobachtung';
				}
				resolve(res); 
			},
			(err) => { console.log(err.stack); reject(err); }
		);
}

module.exports = { 
		evalMonate: evalMonate,
		evalMonat: evalMonat,
		evalTag: evalTag,
		evalAktuell: evalAktuell,
		fixDst: fixDst,
		toDay: toDay
};