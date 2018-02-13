//  (c) Gerhard Döppert, 2017, GNU GPL 3

'use strict';

var module = angular.module('wetterDB');

const colWerte1 = {"temp_o":"aktuell", "temp_o_min": "Min", "temp_o_absmin": "abs Min",
		"temp_o_max": "Max", "temp_o_absmax": "abs Max", "temp_o_avg": "Mittel", 
		"temp_i1":"aktuell", "temp_i1_avg": "Mittel", "temp_i2": "aktuell","temp_i2_avg": "Mittel 2",
		"hum_o": "rel. Feuchte", "hum_i": "rel. Feuchte", "pres": "Luftdruck", "lum_o": "Helligkeit", "lum_i": "Helligkeit",
		"precip": "Niederschlag", "sun": "Sonne", "cloud": "Wolken","windd": "Richtung", "windf":"Stärke", "windf_max":"Stärke max"};

const colWerte2 = {"temp_o":"Temp", "temp_o_min": "Temp Min", "temp_o_absmin": "Temp abs Min",
		"temp_o_max": "Temp Max", "temp_o_absmax": "Temp abs Max", "temp_o_avg": "Temp Mittel", 
		"temp_i1":"Temp", "temp_i1_avg": "Temp Mittel", "temp_i2": "Temp 2","temp_i2_avg": "Temp 2 Mittel",
		"hum_o": "rel. Feuchte", "hum_i": "rel. Feuchte", "pres": "Luftdruck", "lum_o": "Helligkeit", "lum_i": "Helligkeit",
		"precip": "Niederschlag", "sun": "Sonne", "cloud": "Wolken","windd": "Richtung", "windf":"Stärke", "windf_max":"Stärke max"};

const colGroups1 = {"temp_o":"Temperatur", "temp_o_min": "Temperatur", "temp_o_absmin": "Temperatur",
		"temp_o_max": "Temperatur", "temp_o_absmax": "Temperatur", "temp_o_avg": "Temperatur", 
		"temp_i1":"Temperatur", "temp_i1_avg": "Temperatur", "temp_i2": "Temperatur","temp_i2_avg": "Temperatur",
		"hum_o": "", "hum_i": "", "pres": "", "lum_o": "", "lum_i": "",
		"precip": "", "sun": "", "cloud": "", "windd": "Wind", "windf":"Wind", "windf_max":"Wind"};

const colGroups2 = {"temp_o":"außen", "temp_o_min": "außen", "temp_o_absmin": "außen",
		"temp_o_max": "außen", "temp_o_absmax": "außen", "temp_o_avg": "außen", 
		"temp_i1":"innen", "temp_i1_avg": "innen", "temp_i2": "innen","temp_i2_avg": "innen",
		"hum_o": "außen", "hum_i": "innen", "pres": "außen", "lum_o": "außen", "lum_i": "innen",
		"precip": "außen", "sun": "außen", "cloud": "außen", "windd": "außen", "windf":"außen", "windf_max":"außen"};


function prepareList(data, groups, werte) {
	if (data.list.length==0) return;
	if (data.list[0].windd) {
		for (var k=0; k<data.list.length; k++) {
	    	var tv = data.list[k];
	    	tv.windd = Math.round(tv.windd[1],0);
		}
	}
	data.values = [];
	data.colgrname = [];
	data.colgrlen = [];
	var grpknown = {};
	for (var f in data.list[0]) {
		if (werte[f]) {
			data.values.push(f);
			if (groups) {
				var grp = groups[f];
				var k = grpknown[grp];
				if (! (k >= 0)) { 
					grpknown[grp]=data.colgrlen.length; 
					data.colgrname.push(grp);
					data.colgrlen.push(1);
				} else {
					data.colgrlen[k]++;				
				}
			}
		}
	}
	data.werte = werte;
}

function MonateTableController($state, $stateParams, listMonateFactory) {
	this.stat=$stateParams.stat;	
	this.time='Monate';
	this.data = listMonateFactory.getListMonate($stateParams.time,$stateParams.stat, prepareList, 
			this.stat>0?colGroups1:colGroups2, this.stat>0?colWerte1:colWerte2);
}


function MonatTableController($state, $stateParams, listMonatFactory) {
	var monat = new Monat($stateParams.time, 0.5);
	this.monat=$stateParams.time;
	this.stat=$stateParams.stat;	
	this.time='Monat';
	this.vorher= monat.vormonat;
	this.nachher=monat.nmonat;
	this.data = listMonatFactory.getListMonat($stateParams.time,$stateParams.stat, prepareList, 
			this.stat>0?colGroups1:colGroups2, this.stat>0?colWerte1:colWerte2);

}

function TagTableController($state, $stateParams, listTagFactory) {
	var tag = new Tag($stateParams.time, 0);
	this.title = tag.title;
	this.stat=$stateParams.stat;	
	this.monat=tag.monat;
	this.vorher= tag.gestern;
	this.nachher=tag.morgen;
	this.time='Tag';
	this.data = listTagFactory.getListTag($stateParams.time, $stateParams.stat, prepareList, 
			this.stat>0?colGroups1:colGroups2, this.stat>0?colWerte1:colWerte2);
}

 function AuswahlTableController($state, $stateParams, auswahlFactory) {
      this.data = auswahlFactory.getAuswahl($stateParams.stat, prepareList, 
    		  $stateParams.stat>0?colGroups1:colGroups2, $stateParams.stat>0?colWerte1:colWerte2); 
}

 tableSortModule.filter( 'parseTime', function () {
	    return function (input) {
	        var timestamp = Date.parse('2000-01-01T'+input);
	        return isNaN(timestamp) ? null : timestamp;
	    };
	} );


 
module.component('monateTable', {
  templateUrl: 'app/partials/monateTable.html',
  require: { parent: '^root'
  },
  controller:  MonateTableController
});

module.component('monatTable', {
	  templateUrl: 'app/partials/monatTable.html',
	  require: { parent: '^root'
	  },
	  controller: MonatTableController
	});


module.component('tagTable', {
  templateUrl: 'app/partials/tagTable.html',
  require: { parent: '^root'
  },
  controller: TagTableController
});

module.component('auswahlTable', {
	  templateUrl: 'app/partials/auswahlTable.html',
	  
	  controller: AuswahlTableController
	});


/**
 * 
 */