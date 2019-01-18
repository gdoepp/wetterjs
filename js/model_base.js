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
					res.rows[j].link = { rel: 'child', href: base_url + '/listMonat?stat='+stat+'&monat='+res.rows[j].monat, method: 'get'};
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
					res.rows[j].link = {rel: 'child', href: base_url + '/listTag?stat='+stat+'&tag='+res.rows[j].time_d, method: 'get'};
					res.rows[j].type = 'Tag';
				}
				resolve(res); 
			},
			(err) => { console.log(err.stack); reject(err); }
		);	
}

function threeDays(tag) {
	var t0 = toDay(tag);
	var t1 = new Date(t0), t2 = new Date(t0);
	t1.setDate(t0.getDate() - 1);
	fixDst(t1);
	t2.setDate(t0.getDate() +  1);
	fixDst(t2);

	return [t1, t2];
}

function threeDaysLocal(tag) {
	var [tag1, tag2] = threeDays(tag);
	var prvtag = tag1.toLocaleDateString();
	var nxttag = tag2.toLocaleDateString();
	return [prvtag, nxttag];
}

// return data for one or more days, no aggregation
function evalTag(prom, tag, isTage, stat, resolve, reject) {
		
		var [prvtag, nxttag] = threeDaysLocal(tag);
		var t0 = toDay(tag);
			
		prom.then(
			(res0) => {
				var res = {};
				res.rows = res0.rows;
				res.type = isTage ? 'Tage' : 'Tag';
				res.time = tag;
				res.stat = stat;
				var links = [];
				
				links.push({ rel: "self", href: base_url + '/listTag?stat='+stat+'&tag='+tag+ (isTage?'&tage=3':''), method: 'get'});
				
				links.push({rel: "up", 
							href: base_url + '/listMonat?stat='+stat+'&monat='+(t0.getMonth()+1) + '.' + t0.getFullYear(), 
							method: 'get'});
				
				if (isTage) {
					links.push({rel: 't1', href: base_url + '/listTag?stat='+stat+'&tag='+tag, method: 'get'});
					links.push({rel: 'nxt', href: base_url + '/listTag?stat='+stat+'&tag='+nxttag+'&tage=3', method: 'get'});
					links.push({rel: 'prv', href: base_url + '/listTag?stat='+stat+'&tag='+prvtag+'&tage=3', method: 'get'});
				} else {
					links.push({rel: 't3', href: base_url + '/listTag?stat='+stat+'&tag='+tag+'&tage=3', method: 'get'});
					links.push({rel: 'nxt', href: base_url + '/listTag?stat='+stat+'&tag='+nxttag, method: 'get'});
					links.push({rel: 'prv', href: base_url + '/listTag?stat='+stat+'&tag='+prvtag, method: 'get'});
				}

				res.links = links;

				for (var j=0; j<res.rows.length; j++) {
					res.rows[j].day = res.rows[j].day.toLocaleDateString();
					res.rows[j].time_t = res.rows[j].time_t.toLocaleTimeString();
					
					var phi = 1.0*res.rows[j].hum_o;
					var theta=0;
					if (res.rows[j].hasOwnProperty('temp_o')) {
						theta = 1.0*res.rows[j].temp_o;
					} else {
						theta = 1.0*res.rows[j].temp_o1;
					}
					
					res.rows[j].taup = (241.2*Math.log(phi/100.0) + (4222.03716*theta)/(241.2+theta)) /
					   (17.5043-Math.log(phi/100.0) - (17.5043*theta)/(241.2+theta));
					res.rows[j].taup = Number(res.rows[j].taup).toFixed(2);
					
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
		threeDays: threeDays,
		threeDaysLocal: threeDaysLocal,
		evalAktuell: evalAktuell,
		fixDst: fixDst,
		toDay: toDay
};