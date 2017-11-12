//  (c) Gerhard Döppert, 2017

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
  
WetterController.$inject = ['$scope', '$state', 'auswahlFactory'];

var values={'pres': {name:'Luftdruck', func:'P', offset: 0.5}, 
		    'hum_o': {name:'rel. Luftfeuchte', func:'H', offset: 0.5}, 
		    'precip': {name:'Niederschlag', func:'R', offset: 0},
		    'cloud': {name:'Wolken', func:'N', offset: 0},
		    'sun': {name:'Sonne', func:'S', offset: 0},
		    'windf': {name:'Windstärke', func:'F', offset: 0}
};


function WetterController($scope, $state, auswahlFactory) {
   $scope.data = {
    jahr: '2017',
    monat: 1,
    tag: 1,
    state: 'auswahl',
    stat: '00000',
    stats: [{id:'00000',name:'HHH'},{id:'04928', name:'Stuttgart'},{id:'01420', name:'Frankfurt'},
    	{id:'03379', name:'München'}, {id:'01975', name:'Hamburg'}, {id:'00433', name:'Berlin'} ],
    statChanged: function() {
    	console.log("stat changed: " + $scope.data.stat);
    	$state.go('.', {stat:$scope.data.stat});
    }
   };
      
   $scope.data.auswahl = auswahlFactory.getAuswahl($scope.data.stat);
   
   $scope.goAuswahl = function(state) {
	   $state.go('auswahl',{tag: state, stat:$scope.data.stat}, {reload:true});
   }
   $scope.goTag = function(state) {
	   $state.go('listTag',{tag: state, stat:$scope.data.stat}, {reload:true});
   }
   $scope.goTagDT = function(state) {
	   $state.go('listTagDT',{tag: state, stat:$scope.data.stat}, {reload:true});
   }
   $scope.goTagDP = function(state, value) {
	   $state.go('listTagD'+values[value].func,{tag: state, stat:$scope.data.stat}, {reload:true});
   }
   
   $scope.goMonat = function(state) {
	   $state.go('listMonat',{monat: state, stat:$scope.data.stat});
   }
   $scope.goMonatDT = function(state) {
	   $state.go('listMonatDT',{monat: state, stat:$scope.data.stat});
   }
   $scope.goMonatDP = function(state, value) {
	   $state.go('listMonatD'+values[value].func,{monat: state, stat:$scope.data.stat});
   }
   
   $scope.goMonate = function(state) {
	   $state.go('listMonate',{jahr: state, stat:$scope.data.stat});
   }
   $scope.goMonateDT = function(state) {
	   $state.go('listMonateDT',{jahr: state, stat:$scope.data.stat});
   }
   $scope.goMonateDP = function(state, value) {
	   $state.go('listMonateD'+values[value].func,{jahr: state, stat:$scope.data.stat});
   }
   $scope.update = function(state, value) {
	   $state.go('update',{stat:$scope.data.stat});
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
		
		var mon = monjahr.split(".");
		var monat=mon[0];
		var jahr=mon[1];
		
		Zeit(this, jahr);
		
		var tage = [];
		var x = [];
		for (var j=0; j<this.monlen[monat-1]; j++) {
			x.push(j);
			tage.push(j+1);
		}
		x.push(this.monlen[monat-1]);
		
		return {
			index: function(tv, offset) {  // x-Koordinate in Welt-Einheiten
				if (!offset) offset=0;
				return tv.tag-1+offset;   // Tageszahl: 1-31 (relativ zur Beschriftung: Tagesmitte
			},
			tick: function() {	// x-Koordinaten der Beschriftung der x-Achse		
				return x;       // 0.5, 1.5, ...
			},
			xaxis: tage,
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
			index0: 0,      // Intervall x-Koordinaten 0 bis
			indexn: 24*4,   // ... 24*4
			items: 24*4,
			monat: (tag.getMonth()+1) + "." + (tag.getFullYear()) + "."
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
	this.rows = listMonateFactory.getListMonate($stateParams.jahr,$stateParams.stat, prepareList);
}

ListMonateDTController.$inject = ['$state', '$stateParams', 'listMonateFactory', 'svgMakerFactory'];

function ListMonateDTController($state, $stateParams, listMonateFactory, svgMakerFactory) {
	this.rows = listMonateFactory.getListMonate($stateParams.jahr,$stateParams.stat, svgMakerFactory.prepareTemp, 
			new Jahr($stateParams.jahr, 0.5));
}

ListMonateDPController.$inject = ['$state', '$stateParams', 'listMonateFactory', 'svgMakerFactory'];

function ListMonateDPController($state, $stateParams, listMonateFactory, svgMakerFactory) {
	this.value=$state.current.data;
	this.rows = listMonateFactory.getListMonate($stateParams.jahr,$stateParams.stat, svgMakerFactory.preparePhen, 
			new Jahr($stateParams.jahr, values[this.value].offset), $state.current.data);
	this.wert= values[this.value].name;
}

ListMonateDFController.$inject = ['$state', '$stateParams', 'listMonateFactory', 'svgMakerFactory'];

function ListMonateDFController($state, $stateParams, listMonateFactory, svgMakerFactory) {
	this.rows = listMonateFactory.getListMonate($stateParams.jahr,$stateParams.stat, svgMakerFactory.prepareWind, 
			new Jahr($stateParams.jahr, 0), $state.current.data);
	this.value=$state.current.data;
	this.wert= values[this.value].name;
}

ListMonatController.$inject = ['$state', '$stateParams', 'listMonatFactory'];

function ListMonatController($state, $stateParams, listMonatFactory) {
	this.rows = listMonatFactory.getListMonat($stateParams.monat,$stateParams.stat, prepareList);
	this.monat=$stateParams.monat;	
}

ListMonatDTController.$inject = ['$state', '$stateParams', 'listMonatFactory', 'svgMakerFactory'];

function ListMonatDTController($state, $stateParams, listMonatFactory, svgMakerFactory) {
	this.rows = listMonatFactory.getListMonat($stateParams.monat,$stateParams.stat, svgMakerFactory.prepareTemp, 
			new Monat($stateParams.monat, 0.5));
	this.monat=$stateParams.monat;
}

ListMonatDPController.$inject = ['$state', '$stateParams', 'listMonatFactory', 'svgMakerFactory'];

function ListMonatDPController($state, $stateParams, listMonatFactory, svgMakerFactory) {
	this.value=$state.current.data;
	this.rows = listMonatFactory.getListMonat($stateParams.monat,$stateParams.stat, svgMakerFactory.preparePhen, 
			new Monat($stateParams.monat, values[this.value].offset), $state.current.data);
	this.monat=$stateParams.monat;
	this.wert= values[this.value].name;
}

ListMonatDFController.$inject = ['$state', '$stateParams', 'listMonatFactory', 'svgMakerFactory'];

function ListMonatDFController($state, $stateParams, listMonatFactory, svgMakerFactory) {
	this.rows = listMonatFactory.getListMonat($stateParams.monat,$stateParams.stat, svgMakerFactory.prepareWind, 
			new Monat($stateParams.monat, 0), $state.current.data);
	this.monat=$stateParams.monat;
	this.value=$state.current.data;
	this.wert= values[this.value].name;
}

ListTagController.$inject = ['$state', '$stateParams', 'listTagFactory'];

function ListTagController($state, $stateParams, listTagFactory) {
	this.rows = listTagFactory.getListTag($stateParams.tag,$stateParams.stat, prepareList);
	var tag = new Tag($stateParams.tag, 0);
	this.title = tag.title;
	this.monat=tag.monat;
	this.atTag=1;
}

ListTagDTController.$inject = ['$state', '$stateParams', 'listTagFactory', 'svgMakerFactory'];

function ListTagDTController($state, $stateParams, listTagFactory, svgMakerFactory) {
	var tag = new Tag($stateParams.tag, 0.5);
	this.rows = listTagFactory.getListTag($stateParams.tag,$stateParams.stat, svgMakerFactory.prepareTemp, tag);
	this.monat=tag.monat;
	this.atTag=1;
}

ListTagDPController.$inject = ['$state', '$stateParams', 'listTagFactory', 'svgMakerFactory'];

function ListTagDPController($state, $stateParams, listTagFactory, svgMakerFactory) {
	this.value=$state.current.data;
	var tag = new Tag($stateParams.tag, values[this.value].offset);
	this.rows = listTagFactory.getListTag($stateParams.tag,$stateParams.stat, svgMakerFactory.preparePhen, tag, $state.current.data);
	this.monat=tag.monat;
	this.wert= values[this.value].name;
	this.atTag=1;
}

ListTagDFController.$inject = ['$state', '$stateParams', 'listTagFactory', 'svgMakerFactory'];

function ListTagDFController($state, $stateParams, listTagFactory, svgMakerFactory) {
	var tag = new Tag($stateParams.tag, 0);
	this.rows = listTagFactory.getListTag($stateParams.tag,$stateParams.stat, svgMakerFactory.prepareWind, tag, $state.current.data);
	this.monat=tag.monat;
	this.value=$state.current.data;
	this.wert= values[this.value].name;
	this.atTag=1;
}

UpdateController.$inject = ['$state', '$stateParams', 'updateFactory'];

function UpdateController($state, $stateParams, updateFactory) {
	this.result = updateFactory.update($stateParams.stat);
}

