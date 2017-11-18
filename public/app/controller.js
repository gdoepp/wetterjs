//  (c) Gerhard Döppert, 2017, GNU GPL 3

'use strict';
angular.module('wetterDB') 
  .controller('WetterController', WetterController)
  .controller('AuswahlController', AuswahlController)
  .controller('ListMonateController', ListMonateController)
  .controller('ListMonateDTController', ListMonateDTController)
  .controller('ListMonateDPController', ListMonateDPController)
  .controller('ListMonateDFController', ListMonateDFController)
  .controller('ListMonatController', ListMonatController)
  .controller('ListMonatDTController', ListMonatDTController)
  .controller('ListMonatDPController', ListMonatDPController)
  .controller('ListMonatDFController', ListMonatDFController)
  .controller('ListTagController', ListTagController)
  .controller('ListTagDTController', ListTagDTController)
  .controller('ListTagDPController', ListTagDPController)
  .controller('ListTagDFController', ListTagDFController)
  .controller('UpdateController', UpdateController);
  
WetterController.$inject = ['$scope', '$state', 'statsFactory'];

var values={'temp': {name:'Temperatur', func:'T', offset: 0.5}, 
			'pres': {name:'Luftdruck', func:'P', offset: 0.5},
		    'hum_o': {name:'rel. Luftfeuchte', func:'H', offset: 0.5}, 
		    'precip': {name:'Niederschlag', func:'R', offset: 0},
		    'cloud': {name:'Wolken', func:'N', offset: 0},
		    'sun': {name:'Sonne', func:'S', offset: 0},
		    'windf': {name:'Windstärke', func:'F', offset: 0}
};


function WetterController($scope, $state, statsFactory) {
   $scope.data = {
    jahr: '2017',
    monat: 1,
    tag: 1,
    time: '2017',
    value: 'auswahl',
    per: 'Monate',
    stats: {stat:'', stats:[], admin:0},
    statChanged: function() {
    	//console.log("stat changed: " + $scope.data.stats.stat);
    	$state.go('.', {stat:$scope.data.stats.stat});
    }
   };
      
   $scope.data.stats = statsFactory.getStats(); 
   
   $scope.goAuswahl = function(state) {
	   $state.go('auswahl',{tag: state, stat:$scope.data.stats.stat}, {reload:true});
   }
   $scope.goTag = function(state) {
	   $scope.data.time = state;
	   $scope.data.per = 'Tag';
	   $scope.data.value = '';
	   $state.go('listTag',{time: state, stat:$scope.data.stats.stat}, {reload:true});
   }
   $scope.goMonate = function(state) {
	   $scope.data.time = state;
	   $scope.data.per = 'Monate';
	   $scope.data.value = '';
	   $state.go('listMonate',{time: state, stat:$scope.data.stats.stat});
   }

   $scope.goDP = function(time, value, per) {
	   $scope.data.value = value;
	   $scope.data.time = time;
	   $scope.data.per = per;
	   $state.go('list'+per+'D'+values[value].func,{time: time, stat:$scope.data.stats.stat}, {reload:true});
   }
   
   $scope.goMonat = function(state) {
	   $scope.data.time = state;
	   $scope.data.per = 'Monat';
	   $scope.data.value = '';
	   $state.go('listMonat',{time: state, stat:$scope.data.stats.stat});
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

function Tag(tag, offset) {
			
		var x = [];
		
		if (offset==0) { x.push('23-'); offset=1; } else { offset=0; }
		
		for (var j=0; j<=24-offset; j++) { x.push(j); }
		
		if (tag && tag !== 'undefined' && tag != 0) {
			var tg = tag.split('.');
			if (tg.length != 3) { tg = tag.split("-"); tag = new Date(tg[0], tg[1]-1, tg[2])}
			else {
				tag=new Date(tg[2], tg[1]-1, tg[0]);
			}
		} else {
			tag = new Date();
		}
		
		var gestern = new Date(tag);
		gestern.setDate(tag.getDate()-1);
		var morgen = new Date(tag);
		morgen.setDate(tag.getDate()+1);
			
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
			title: 'im Tagesverlauf ' + tag.getDate() + "." + (tag.getMonth()+1)+ "." + (tag.getFullYear()),
			gestern: gestern.getDate() + "." + (gestern.getMonth()+1)+ "." + (gestern.getFullYear()),
			morgen: morgen.getDate() + "." + (morgen.getMonth()+1)+ "." + (morgen.getFullYear()),
			index0: 0,      // Intervall x-Koordinaten 0 bis
			indexn: 24*4,   // ... 24*4
			items: 24*4,
			monat: (tag.getMonth()+1) + "." + (tag.getFullYear())
		}	
}

function prepareList(data) {
	for (var k=0; k<data.list.length; k++) {
    	var tv = data.list[k];
    	tv.windd = Math.round(tv.windd[1],0);
	}
}


AuswahlController.$inject = [ "$state", "$stateParams", 'auswahlFactory'];

function AuswahlController($state, $stateParams, auswahlFactory) {
	this.rows = auswahlFactory.getAuswahl($stateParams.stat);
}

ListMonateController.$inject = ['$state', '$stateParams', 'listMonateFactory'];

function ListMonateController($state, $stateParams, listMonateFactory) {
	this.rows = listMonateFactory.getListMonate($stateParams.time,$stateParams.stat, prepareList);
	this.time='Monate';
}

ListMonateDTController.$inject = ['$state', '$stateParams', 'listMonateFactory', 'svgMakerFactory'];

function ListMonateDTController($state, $stateParams, listMonateFactory, svgMakerFactory) {
	this.rows = listMonateFactory.getListMonate($stateParams.time,$stateParams.stat, svgMakerFactory.prepareTemp, 
			new Jahr($stateParams.time, 0.5));
	this.value=$state.current.data;
	this.time='Monate';
}

ListMonateDPController.$inject = ['$state', '$stateParams', 'listMonateFactory', 'svgMakerFactory'];

function ListMonateDPController($state, $stateParams, listMonateFactory, svgMakerFactory) {
	this.value=$state.current.data;
	this.rows = listMonateFactory.getListMonate($stateParams.time,$stateParams.stat, svgMakerFactory.preparePhen, 
			new Jahr($stateParams.time, values[this.value].offset), $state.current.data);
	this.wert= values[this.value].name;
	this.time='Monate';
}

ListMonateDFController.$inject = ['$state', '$stateParams', 'listMonateFactory', 'svgMakerFactory'];

function ListMonateDFController($state, $stateParams, listMonateFactory, svgMakerFactory) {
	this.rows = listMonateFactory.getListMonate($stateParams.time,$stateParams.stat, svgMakerFactory.prepareWind, 
			new Jahr($stateParams.time, 0), $state.current.data);
	this.value=$state.current.data;
	this.wert= values[this.value].name;
	this.time='Monate';
}

ListMonatController.$inject = ['$state', '$stateParams', 'listMonatFactory'];

function ListMonatController($state, $stateParams, listMonatFactory) {
	this.rows = listMonatFactory.getListMonat($stateParams.time,$stateParams.stat, prepareList);
	this.monat=$stateParams.time;	
	this.time='Monat';
}

ListMonatDTController.$inject = ['$state', '$stateParams', 'listMonatFactory', 'svgMakerFactory'];

function ListMonatDTController($state, $stateParams, listMonatFactory, svgMakerFactory) {
	var monat = new Monat($stateParams.time, 0.5);
	this.rows = listMonatFactory.getListMonat($stateParams.time,$stateParams.stat, svgMakerFactory.prepareTemp, 
			monat);
	this.value=$state.current.data;
	this.monat=$stateParams.monat;
	this.vorher= monat.vormonat;
	this.nachher=monat.nmonat;
	this.time='Monat';
}

ListMonatDPController.$inject = ['$state', '$stateParams', 'listMonatFactory', 'svgMakerFactory'];

function ListMonatDPController($state, $stateParams, listMonatFactory, svgMakerFactory) {
	this.value=$state.current.data;
	var monat = new Monat($stateParams.time, values[this.value].offset);
	this.rows = listMonatFactory.getListMonat($stateParams.time,$stateParams.stat, svgMakerFactory.preparePhen, 
			monat, $state.current.data);
	this.monat=$stateParams.monat;
	this.vorher= monat.vormonat;
	this.nachher=monat.nmonat;
	this.wert= values[this.value].name;
	this.time='Monat';
}

ListMonatDFController.$inject = ['$state', '$stateParams', 'listMonatFactory', 'svgMakerFactory'];

function ListMonatDFController($state, $stateParams, listMonatFactory, svgMakerFactory) {
	var monat = new Monat($stateParams.time, 0);
	this.rows = listMonatFactory.getListMonat($stateParams.time,$stateParams.stat, svgMakerFactory.prepareWind, 
			monat, $state.current.data);
	this.monat=$stateParams.monat;
	this.vorher= monat.vormonat;
	this.nachher=monat.nmonat;
	this.value=$state.current.data;
	this.wert= values[this.value].name;
	this.time='Monat';
}

ListTagController.$inject = ['$state', '$stateParams', 'listTagFactory'];

function ListTagController($state, $stateParams, listTagFactory) {
	this.rows = listTagFactory.getListTag($stateParams.time, $stateParams.stat, prepareList);
	var tag = new Tag($stateParams.time, 0);
	this.title = tag.title;
	this.monat=tag.monat;
	this.time='Tag';
}

ListTagDTController.$inject = ['$state', '$stateParams', 'listTagFactory', 'svgMakerFactory'];

function ListTagDTController($state, $stateParams, listTagFactory, svgMakerFactory) {
	var tag = new Tag($stateParams.time, 0.5);
	this.rows = listTagFactory.getListTag($stateParams.time, $stateParams.stat, svgMakerFactory.prepareTemp, tag);
	this.monat=tag.monat;
	this.value=$state.current.data;
	this.vorher=tag.gestern;
	this.nachher=tag.morgen;
	this.time='Tag';
}

ListTagDPController.$inject = ['$state', '$stateParams', 'listTagFactory', 'svgMakerFactory'];

function ListTagDPController($state, $stateParams, listTagFactory, svgMakerFactory) {
	this.value=$state.current.data;
	var tag = new Tag($stateParams.time, values[this.value].offset);
	this.rows = listTagFactory.getListTag($stateParams.time, $stateParams.stat, svgMakerFactory.preparePhen, tag, $state.current.data);
	this.monat=tag.monat;
	this.vorher=tag.gestern;
	this.nachher=tag.morgen;
	this.wert= values[this.value].name;
	this.time='Tag';
}

ListTagDFController.$inject = ['$state', '$stateParams', 'listTagFactory', 'svgMakerFactory'];

function ListTagDFController($state, $stateParams, listTagFactory, svgMakerFactory) {
	var tag = new Tag($stateParams.time, 0);
	this.rows = listTagFactory.getListTag($stateParams.time, $stateParams.stat, svgMakerFactory.prepareWind, tag, $state.current.data);
	this.monat=tag.monat;
	this.vorher=tag.gestern;
	this.nachher=tag.morgen;
	this.value=$state.current.data;
	this.wert= values[this.value].name;
	this.time='Tag';
}

UpdateController.$inject = ['$state', '$stateParams', 'updateFactory'];

function UpdateController($state, $stateParams, updateFactory) {
	this.result = updateFactory.update($stateParams.stat);
	this.result.result = {update:2};
}

