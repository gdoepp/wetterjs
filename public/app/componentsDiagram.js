//  (c) Gerhard Döppert, 2017, GNU GPL 3

'use strict';

var module = angular.module('wetterDB');

// components for svg diagrams

function MonateDTController($state, $stateParams, listMonateFactory, svgMakerFactory) {
	this.data = listMonateFactory.getListMonate($stateParams.time,$stateParams.stat, svgMakerFactory.prepareTemp, 
			new Jahr($stateParams.time, 0.5));
	this.value=$state.current.data;
	this.time='Monate';
}

module.component('monateDT', {
  transclude: true,
  templateUrl: 'app/partials/monateDT.html',
  require: { parent: '^root'
  },
  controller: MonateDTController
});


function MonateDPController($state, $stateParams, listMonateFactory, svgMakerFactory) {
	this.value=$state.current.data;
	this.data = listMonateFactory.getListMonate($stateParams.time,$stateParams.stat, svgMakerFactory.preparePhen, 
			new Jahr($stateParams.time, values[this.value].offset), $state.current.data);
	this.wert= values[this.value].name;
	this.time='Monate';
}

module.component('monateDP', {
	  transclude: true,
	  templateUrl: 'app/partials/monateDP.html',
	  require: { parent: '^root'
	  },
	  controller: MonateDPController
	})
.component('monateDR', {
	  transclude: true,
	  templateUrl: 'app/partials/monateDR.html',
	  require: { parent: '^root'
	  },
	  controller: MonateDPController
	});

function MonateDFController($state, $stateParams, listMonateFactory, svgMakerFactory) {
	this.data = listMonateFactory.getListMonate($stateParams.time,$stateParams.stat, svgMakerFactory.prepareWind, 
			new Jahr($stateParams.time, 0), $state.current.data);
	this.value=$state.current.data;
	this.wert= values[this.value].name;
	this.time='Monate';
}

module.component('monateDF', {
	  transclude: true,
	  templateUrl: 'app/partials/monateDF.html',
	  require: { parent: '^root'
	  },
	  controller: MonateDFController
	});

function MonatDTController($state, $stateParams, listMonatFactory, svgMakerFactory) {
	var monat = new Monat($stateParams.time, 0.5);
	this.data = listMonatFactory.getListMonat($stateParams.time,$stateParams.stat, svgMakerFactory.prepareTemp, 
			monat);
	this.value=$state.current.data;
	this.wert= values[this.value].name;
	this.monat=$stateParams.monat;
	this.vorher= monat.vormonat;
	this.nachher=monat.nmonat;
	this.time='Monat';
}

module.component('monatDT', {
	  transclude: true,
	  templateUrl: 'app/partials/tageDT.html',
	  require: { parent: '^root'
	  },
	  controller: MonatDTController
	});

function MonatDPController($state, $stateParams, listMonatFactory, svgMakerFactory) {
	this.value=$state.current.data;
	var monat = new Monat($stateParams.time, values[this.value].offset);
	this.data = listMonatFactory.getListMonat($stateParams.time,$stateParams.stat, svgMakerFactory.preparePhen, 
			monat, $state.current.data);
	this.monat=$stateParams.monat;
	this.vorher= monat.vormonat;
	this.nachher=monat.nmonat;
	this.wert= values[this.value].name;
	this.time='Monat';
}

module.component('monatDP', {
	  transclude: true,
	  templateUrl: 'app/partials/tageDP.html',
	  require: { parent: '^root'
	  },
	  controller: MonatDPController
	})
   .component('monatDR', {
	  transclude: true,
	  templateUrl: 'app/partials/tageDR.html',
	  require: { parent: '^root'
	  },
	  controller: MonatDPController
	});

function MonatDFController($state, $stateParams, listMonatFactory, svgMakerFactory) {
	var monat = new Monat($stateParams.time, 0);
	this.data = listMonatFactory.getListMonat($stateParams.time,$stateParams.stat, svgMakerFactory.prepareWind, 
			monat, $state.current.data);
	this.monat=$stateParams.monat;
	this.vorher= monat.vormonat;
	this.nachher=monat.nmonat;
	this.value=$state.current.data;
	this.wert= values[this.value].name;
	this.time='Monat';
}

module.component('monatDF', {
	  transclude: true,
	  templateUrl: 'app/partials/tageDF.html',
	  require: { parent: '^root'
	  },
	  controller: MonatDFController
	});

function TagDTController($state, $stateParams, listTagFactory, svgMakerFactory) {
	this.value=$state.current.data;
	var tag = new Tag($stateParams.time, values[this.value].offset);
	this.data = listTagFactory.getListTag($stateParams.time, $stateParams.stat, svgMakerFactory.prepareTemp, tag, $state.current.data);
	this.monat=tag.monat;
	this.vorher=tag.gestern;
	this.nachher=tag.morgen;
	this.time='Tag';
	this.wert= values[this.value].name;
}

module.component('tagDT', {
	  transclude: true,
	  templateUrl: 'app/partials/tageDT.html',
	  require: { parent: '^root'
	  },
	  controller: TagDTController
	});


function TagDPController($state, $stateParams, listTagFactory, svgMakerFactory) {
	this.value=$state.current.data;
	var tag = new Tag($stateParams.time, values[this.value].offset);
	this.data = listTagFactory.getListTag($stateParams.time, $stateParams.stat, svgMakerFactory.preparePhen, tag, $state.current.data);
	this.monat=tag.monat;
	this.vorher=tag.gestern;
	this.nachher=tag.morgen;
	this.heute=tag.heute;
	this.wert= values[this.value].name;
	this.time='Tag';
}

function TageDPController($state, $stateParams, listTagFactory, svgMakerFactory) {
	this.value=$state.current.data;
	var tage = new Tage($stateParams.time, values[this.value].offset);
	this.data = listTagFactory.getListTage(tage.gestern, tage.morgen, $stateParams.stat, svgMakerFactory.preparePhen, tage, $state.current.data);
	this.monat=tage.monat;
	this.vorher=tage.gestern;
	this.nachher=tage.morgen;
	this.heute=tage.heute;
	this.wert= values[this.value].name;
	this.time='Tage';
}

module.component('tagDP', {
	  transclude: true,
	  templateUrl: 'app/partials/tageDP.html',
	  require: { parent: '^root'
	  },
	  controller: TagDPController
	})
	.component('tageDP', {
	  transclude: true,
	  templateUrl: 'app/partials/tageDP.html',
	  require: { parent: '^root'
	  },
	  controller: TageDPController
	})
   .component('tagDR', {
	  transclude: true,
	  templateUrl: 'app/partials/tageDR.html',
	  require: { parent: '^root'
	  },
	  controller: TagDPController
	});

function TagDFController($state, $stateParams, listTagFactory, svgMakerFactory) {
	this.value=$state.current.data;
	var tag = new Tag($stateParams.time, values[this.value].offset);
	this.data = listTagFactory.getListTag($stateParams.time, $stateParams.stat, svgMakerFactory.prepareWind, tag, $state.current.data);
	this.monat=tag.monat;
	this.vorher=tag.gestern;
	this.nachher=tag.morgen;
	this.wert= values[this.value].name;
	this.time='Tag';
}

module.component('tagDF', {
	  transclude: true,
	  templateUrl: 'app/partials/tageDF.html',
	  require: { parent: '^root'
	  },
	  controller: TagDFController
	});




