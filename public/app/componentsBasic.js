//  (c) Gerhard Döppert, 2017, GNU GPL 3

'use strict';

var module = angular.module('wetterDB');

var values={'temp': {name:'Temperatur', func:'T', offset: 0.5}, 
			'pres': {name:'Luftdruck', func:'P', offset: 0.5},
		    'hum_o': {name:'rel. Luftfeuchte', func:'H', offset: 0.5}, 
		    'precip': {name:'Niederschlag', func:'R', offset: 0},
		    'cloud': {name:'Wolken', func:'N', offset: 0},
		    'sun': {name:'Sonne', func:'S', offset: 0},
		    'windf': {name:'Windstärke', func:'F', offset: 0}
};

function WetterController($scope, $state, statsFactory) {
	this.myScope = $scope;
   $scope.data = {
    jahr: '2017',
    monat: 1,
    tag: 1,
    time: '2017',
    value: 'auswahl',
    per: 'Monate',
    stats: {stat:'', stats:[], admin:0},
    statChanged: function() {
    	$state.go('.', {stat:$scope.data.stats.stat});
    },
    jahrChanged: function() {
    	$scope.data.time=$scope.data.time.replace(/[0-9]{4}/, $scope.data.jahr);    	
    	$state.go('.', {time:$scope.data.time});
    }
   };

   var checkTime = (time) => {
	   if (time == 0) {
		   var h = new Date();
		   if ($scope.data.stats.stat !== '00000') {
			   h.setDate(h.getDate()-1);
		   }
		   time = h.getDate() + "." + (h.getMonth()+1)+ "." + (h.getFullYear());	   
	   }
	   return time;
   }
   
   $scope.data.stats = statsFactory.getStats(); 
   
   $scope.goAuswahl = function(state) {
	   $state.go('auswahl',{tag: state, stat:$scope.data.stats.stat}, {reload:true});
   }
  
   $scope.goDP = function(time, value, per) {
	   $scope.data.value = value;
	   time = checkTime(time);
	   $scope.data.time = time;	   
	   $scope.data.per = per;
	   $state.go('list'+per+'D'+values[value].func,{time: time, stat:$scope.data.stats.stat}, {reload:true});
   }
  
   $scope.goList = function(time, per) {
	   time = checkTime(time);
	   $scope.data.time = time;
	   $scope.data.per = per;
	   $scope.data.value = '';
	   $state.go('list'+per, {time: time, stat:$scope.data.stats.stat});
   }
   
   $scope.update = function(state, value) {
	   $state.go('update',{stat:$scope.data.stats.stat});
   }
} 

// no classes because of ie11

function Zeit(obj, jahr) {
		obj.monName = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
	
		obj.monlen = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		
		obj.mon1st = [];
		var mon1st0 = 0;
		if (jahr%4 == 0) {
			obj.monlen[1] = 29;
		}
		for (var j=0; j<12; j++) {
			obj.mon1st.shift(mon1st0);
			mon1st0 += obj.monlen[j];
		}			
}

function Jahr(jahr) {

	Zeit(this, jahr);
	
	return {
		
			index: function(tv, offset) { // x-Koordinaten in Welt-Einheiten:
				if (!offset) offset=0;
				var mon=tv.monat.split(".",2);			
				return mon[0]-1+offset;  
			},
			tick: function() {			// Beschriftung x-Achse, x-Koordinaten in Welt-Einheiten
				return [0,1,2,3,4,5,6,7,8,9,10,11];
			},
			xaxis: this.monName, // Beschriftung x-Achse: Monatsnamen
			title: 'im Jahresverlauf '+jahr,
			index0: 0, // Intervall x-Koordinaten in Welt-Einheiten von
			indexn: 12  //... bis
		}	
}


function Monat (monjahr) {
		
		var mon = monjahr.trim().split(".");
		var monat=Number(mon[0]);
		var jahr=Number(mon[1]);
		
		Zeit(this, jahr);
		
		var tage = [];
		var x = [];
		for (var j=0; j<this.monlen[monat-1]; j++) {
			x.push(j);
			tage.push(j+1);
		}
		x.push(this.monlen[monat-1]);
		
		var monat1 = monat-1;
		var jahr1 = jahr;
		if (monat1==0) { jahr1--; monat1 = 12; }
		var vormonat = monat1 + '.' + jahr1;
		jahr1 = jahr;
		monat1 = monat+1;
		if (monat1==13) { monat1 = 1; jahr1++; }
		var nmonat = monat1 + '.' + jahr1;
		
		return {
			index: function(tv, offset) {  // x-Koordinate in Welt-Einheiten
				if (!offset) offset=0;
				return tv.tag-1+offset;   // Tageszahl: 1-31 (relativ zur Beschriftung: Tagesmitte
			},
			tick: function() {	// x-Koordinaten der Beschriftung der x-Achse		
				return x;       // 0.5, 1.5, ...
			},
			xaxis: tage,
			vormonat: vormonat,
			nmonat: nmonat,
			title: 'im Monatsverlauf ' + this.monName[monat-1] + " " + jahr,
			index0: 0,  // x-Koordinate von 0
			indexn: this.monlen[monat-1],   // bis Monatslänge
			items: x.length,
			jahr: jahr
		}
	
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

function Tag(tag, offset) {
			
		var x = [];
		
		if (offset==0) { x.push('23-'); offset=1; } else { offset=0; }
		
		for (var j=0; j<=24-offset; j++) { x.push(j); }
		
		tag = toDay(tag);
		
		var gestern = new Date(tag);
		gestern.setDate(tag.getDate()-1);
		var morgen = new Date(tag);
		morgen.setDate(tag.getDate()+1);
		var heute = tag.getDate() + "." + (tag.getMonth()+1)+ "." + (tag.getFullYear());
			
		return {
			
			index: function(tv, offs) {      // x-Koordinate
				if (!offs) offs=0;
				var hm = tv.time_t.split(":");
				var j = hm[0]*4 + Math.floor(hm[1]/15); 
				return j;   // Stunde + Viertelstunde: 0 - 23*4+3
			},
			tick: function() {  // x-Koordinate Beschriftung der x-Achse
				var res;
				res = [];
			    for (var j=0; j<x.length; j++) {   // 0 - 24*4
				    res.push(j*4);
			    }
			    return res;
			},
			xaxis: x,
			heute: heute,
			title: 'im Tagesverlauf ' + heute,
			gestern: gestern.getDate() + "." + (gestern.getMonth()+1)+ "." + (gestern.getFullYear()),
			morgen: morgen.getDate() + "." + (morgen.getMonth()+1)+ "." + (morgen.getFullYear()),
			index0: 0,      // Intervall x-Koordinaten 0 bis
			indexn: 24*4,   // ... 24*4
			items: 24*4,
			monat: (tag.getMonth()+1) + "." + (tag.getFullYear())
		}	
}



function UpdateController($state, $stateParams, updateFactory) {
	this.result = updateFactory.update($stateParams.stat);
	this.result.result = {update:2};
}

var root = {
		  transclude: true,
		  templateUrl: 'app/partials/root.html',
		  controller: WetterController
		};

module.component('root', root);

module.component('updateResult', {
  templateUrl: 'app/partials/update.html',
  controller: 'UpdateController',
  require: { parent: '^root'
  },
  transclude: true
});
